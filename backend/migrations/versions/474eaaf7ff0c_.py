"""empty message

Revision ID: 474eaaf7ff0c
Revises: d4dfc72009c8
Create Date: 2019-07-09 16:12:18.386629

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '474eaaf7ff0c'
down_revision = 'd4dfc72009c8'
branch_labels = None
depends_on = None


def upgrade():
# ### commands auto generated by Alembic - please adjust! ###
    op.create_table('admin_log',
    sa.Column('id', sa.Integer(), nullable=False),
    sa.Column('date_created', sa.DateTime(), nullable=False),
    sa.Column('event', sa.String(length=255), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('user_id', sa.Integer(), nullable=True),
    sa.Column('ip', sa.String(length=255), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['user.id'], ),
    sa.PrimaryKeyConstraint('id')
    )
    # ### end Alembic commands ###


def downgrade():
# ### commands auto generated by Alembic - please adjust! ###
    op.drop_table('admin_log')
    # ### end Alembic commands ###
