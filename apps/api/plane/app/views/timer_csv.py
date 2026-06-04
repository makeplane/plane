import datetime
import pytz

def get_day_splits(segments, tz, nowUtc):
    from collections import defaultdict
    day_seconds = defaultdict(int)
    first_start = None
    last_end = None
    
    for seg in segments:
        start_dt = getattr(seg, 'segment_start', None)
        if not start_dt:
            continue
            
        end_dt = getattr(seg, 'segment_end', None) or nowUtc
        
        if not first_start:
            first_start = start_dt
        last_end = end_dt
        
        current_dt = start_dt
        while current_dt < end_dt:
            local_current = current_dt.astimezone(tz)
            # Find next midnight in local time
            next_midnight_local = (local_current + datetime.timedelta(days=1)).replace(hour=0, minute=0, second=0, microsecond=0)
            # Convert next midnight back to UTC
            next_midnight_utc = pytz.utc.localize(next_midnight_local.replace(tzinfo=None))
            # Actually next_midnight_local is already aware, we can just do:
            chunk_end = min(end_dt, next_midnight_local)
            
            duration = (chunk_end - current_dt).total_seconds()
            
            date_str = local_current.strftime("%Y-%m-%d")
            day_seconds[date_str] += int(duration)
            
            current_dt = chunk_end
            
    return day_seconds, first_start, last_end
