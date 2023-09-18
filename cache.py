class BardResponseCache:
    def __init__(self):
        self.cache = {}

    def set(self, user_id, data):
        self.cache[user_id] = data

    def get(self, user_id):
        return self.cache.get(user_id)

    def remove(self, user_id):
        self.cache.pop(user_id, None)


class DictResponseCache:
    def __init__(self):
        self.cache = {}

    def set(self, user_id, data):
        self.cache[user_id] = data

    def get(self, user_id):
        return self.cache.get(user_id)

    def remove(self, user_id):
        self.cache.pop(user_id, None)
