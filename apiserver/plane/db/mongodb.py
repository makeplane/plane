from pymongo import MongoClient


def singleton(cls):
    instances = {}

    def wrapper(*args, **kwargs):
        if cls not in instances:
            instances[cls] = cls(*args, **kwargs)
        return instances[cls]

    return wrapper


@singleton
class Database:
    db = None
    client = None

    def __init__(self, mongo_uri, database_name):
        self.client = MongoClient(mongo_uri)
        self.db = self.client[database_name]

    def get_db(self):
        return self.db
