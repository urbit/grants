from grant.extensions import ma, db
from grant.utils.misc import gen_random_id


class TagException(Exception):
    pass


class TagAssociation(db.Model):
    __tablename__ = "tag_association"
    id = db.Column(db.Integer(), primary_key=True)
    rfw_id = db.Column(db.Integer, db.ForeignKey('rfw.id'))
    # can add more parent ids so different types can refer to same tags, ex:
    # proposal_id = db.Column(db.Integer, db.ForeignKey('proposal.id'))
    tag_id = db.Column(db.Integer, db.ForeignKey('tag.id'))


class Tag(db.Model):
    __tablename__ = "tag"
    id = db.Column(db.Integer(), primary_key=True)
    text = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text, default='')
    color = db.Column(db.String(255), nullable=False)

    rfws = db.relationship(
        'RFW',
        secondary='tag_association',
        back_populates="tags"
    )

    def __init__(self, **kwargs):
        super().__init__(
            id=gen_random_id(Tag),
            **kwargs
        )

    @staticmethod
    def upsert(**kwargs):
        id = kwargs.get('id', False)
        if id:
            tag = Tag.query.get(id)
            if not tag:
                raise TagException(f'Attempted to update missing tag {id}')
            tag.update(**kwargs)
            return tag
        return Tag.create_tag(**kwargs)

    @staticmethod
    def create_tag(text: str, description: str, color: str):
        tag = Tag(text=text, description=description, color=color)
        db.session.add(tag)
        db.session.flush()
        return tag

    def update(self, **kwargs):
        for key, value in kwargs.items():
            setattr(self, key, value)
        db.session.flush()

    def delete(self):
        db.session.delete(self)
        db.session.flush()


class TagSchema(ma.Schema):
    class Meta:
        additional = ('id', 'text', 'description', 'color')


class TagSchemas:
    list = TagSchema(many=True)
    single = TagSchema()
    list_admin = TagSchema(many=True)
    single_admin = TagSchema()


tag_schemas = TagSchemas()
