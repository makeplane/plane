from rest_framework.response import Response
from rest_framework import status


def list_response(data: dict = None, status=status.HTTP_200_OK, **kwargs):
    if kwargs:
        data = dict( **kwargs, data=data)
    return Response(data, status=status)
