from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import os
import logging
import openai
from dotenv import load_dotenv
from app import models, schemas
from app.database import get_db

load_dotenv()

logger = logging.getLogger(__name__)
router = APIRouter()


async def calculate_priority_score_ai(title: str, description: str) -> float:
    api_key = os.getenv("OPENAI_API_KEY")
    try:
        if not api_key:
            logger.warning("OPENAI_API_KEY not found. Using fallback priority scoring for task: %s", title)
            return calculate_priority_score_fallback(title, description)
        
        prompt = f"""Analyze the following task and determine its priority score on a scale of 0.0 to 1.0, where:
- 0.0-0.3 = Low priority (can be done later, not urgent)
- 0.4-0.6 = Medium priority (should be done soon)
- 0.7-1.0 = High priority (urgent, critical, or time-sensitive)

Task Title: {title}
Task Description: {description or "No description provided"}

Consider factors like:
- Urgency and deadlines
- Importance and impact
- Dependencies on other tasks
- Time sensitivity

Respond with ONLY a number between 0.0 and 1.0 (e.g., 0.75), nothing else."""

        client = openai.OpenAI(api_key=api_key)
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a task priority analyzer. Respond with only a number between 0.0 and 1.0."},
                {"role": "user", "content": prompt}
            ],
            max_tokens=10,
            temperature=0.3
        )
        
        score_text = response.choices[0].message.content.strip()
        score = float(score_text)
        return max(0.0, min(1.0, score))
    except Exception as e:
        logger.error("OpenAI API call failed. Using fallback priority scoring for task: %s. Error: %s", title, str(e), exc_info=True)
        return calculate_priority_score_fallback(title, description)


def calculate_priority_score_fallback(title: str, description: str) -> float:
    title_lower = title.lower()
    desc_lower = description.lower()
    
    urgent_keywords = ["urgent", "asap", "critical", "important", "deadline", "due"]
    high_priority_keywords = ["high", "priority", "soon", "quick"]
    low_priority_keywords = ["low", "later", "optional", "someday"]
    
    score = 0.5
    
    for keyword in urgent_keywords:
        if keyword in title_lower or keyword in desc_lower:
            score += 0.3
            break
    
    for keyword in high_priority_keywords:
        if keyword in title_lower or keyword in desc_lower:
            score += 0.2
            break
    
    for keyword in low_priority_keywords:
        if keyword in title_lower or keyword in desc_lower:
            score -= 0.2
            break
    
    title_length_factor = min(len(title) / 50, 0.1)
    score += title_length_factor
    
    return max(0.0, min(1.0, score))


@router.get("/tasks", response_model=List[schemas.TaskResponse])
def get_tasks(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    tasks = db.query(models.Task).offset(skip).limit(limit).all()
    return tasks


@router.post("/tasks", response_model=schemas.TaskResponse, status_code=201)
async def create_task(task: schemas.TaskCreate, db: Session = Depends(get_db)):
    priority_score = await calculate_priority_score_ai(task.title, task.description or "")
    db_task = models.Task(
        title=task.title,
        description=task.description,
        priority_score=priority_score
    )
    db.add(db_task)
    db.commit()
    db.refresh(db_task)
    return db_task


@router.delete("/tasks/{task_id}", status_code=204)
def delete_task(task_id: int, db: Session = Depends(get_db)):
    db_task = db.query(models.Task).filter(models.Task.id == task_id).first()
    if not db_task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(db_task)
    db.commit()
    return None
