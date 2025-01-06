# strawberry imports
from strawberry.exceptions import GraphQLError


class CustomGraphQLError(GraphQLError):
    def __init__(self, message, code=None, field=None):
        super().__init__(message)
        self.code = code
        self.field = field

    def extensions(self):
        return {"code": self.code, "field": self.field}
