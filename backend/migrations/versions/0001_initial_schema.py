"""initial schema: tasks, workers, assignments

Revision ID: 0001
Revises:
Create Date: 2026-10-17
"""

from collections.abc import Sequence

import sqlalchemy as sa
from alembic import op

revision: str = "0001"
down_revision: str | Sequence[str] | None = None
branch_labels: str | Sequence[str] | None = None
depends_on: str | Sequence[str] | None = None


def upgrade() -> None:
    op.create_table(
        "tasks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("effort", sa.Integer(), nullable=False),
        sa.Column("skills", sa.ARRAY(sa.String()), nullable=False),
        sa.Column("status", sa.String(), nullable=False),
    )
    op.create_table(
        "workers",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("name", sa.String(), nullable=False),
        sa.Column("availability", sa.Integer(), nullable=False),
        sa.Column("skills", sa.ARRAY(sa.String()), nullable=False),
    )
    op.create_table(
        "assignments",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("task_id", sa.Integer(), sa.ForeignKey("tasks.id"), nullable=False, unique=True),
        sa.Column("worker_id", sa.Integer(), sa.ForeignKey("workers.id"), nullable=False),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("last_day_hours", sa.Integer(), nullable=False),
    )


def downgrade() -> None:
    op.drop_table("assignments")
    op.drop_table("workers")
    op.drop_table("tasks")
