"""Add history_event table

Revision ID: c4db14a99db2
Revises: 794f0e8a0d71
Create Date: 2019-06-17 13:47:51.986501

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'c4db14a99db2'
down_revision = '794f0e8a0d71'
branch_labels = None
depends_on = None


def upgrade():
# ### commands auto generated by Alembic - please adjust! ###
    op.create_table('history_event',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('content', sa.Text(), nullable=False),
    sa.Column('date', sa.DateTime(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('proposal_id', sa.Integer(), nullable=True),
    sa.ForeignKeyConstraint(['proposal_id'], ['proposal.id'], ),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
# ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('history_event')
    # ### end Alembic commands ###
