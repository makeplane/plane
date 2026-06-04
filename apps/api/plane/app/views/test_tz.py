import datetime
import pytz

tz = pytz.timezone('America/New_York')
start = datetime.datetime(2023, 10, 10, 23, 0, 0, tzinfo=tz).astimezone(pytz.utc)
local_current = start.astimezone(tz)
print("local_current", local_current)
next_midnight = (local_current + datetime.timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
print("next_midnight", next_midnight)
print("diff", (next_midnight - start).total_seconds())
