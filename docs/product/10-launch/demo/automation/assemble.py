"""Edit step: join the scene recordings, place the voice-over at each scene marker,
write captions (.srt/.vtt) and chapters, normalise loudness, export the MP4.
Usage: python assemble.py   (from anywhere; needs ffmpeg + ffprobe on PATH)
Reads edit.json, scenes.json, recordings/*/markers.json, audio/*.wav.
"""
import json, os, re, subprocess

DEMO = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
P = lambda *a: os.path.join(DEMO, *a)
cfg = json.load(open(P('edit.json'), encoding='utf-8'))
scenes = {s['id']: s for s in json.load(open(P('scenes.json'), encoding='utf-8'))['scenes']}
durations = json.load(open(P('audio/durations.json')))
LEAD = cfg['voiceLead']
tmp = P('exports', 'tmp')
os.makedirs(tmp, exist_ok=True)


def run(args):
    subprocess.run(['ffmpeg', '-nostdin', '-v', 'error', '-y', *args], check=True, timeout=300)


def dur(path):
    return float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', path],
                                capture_output=True, text=True).stdout)


# 1. normalise every segment to 1920x1080 / 30 fps / yuv420p, trimmed to its scenes
timeline = {}          # scene id -> global start (seconds)
t = 0.0
files = []
for i, seg in enumerate(cfg['segments']):
    m = json.load(open(P(seg['markers']), encoding='utf-8'))['scenes']
    t0 = seg.get('trimStart')
    if not isinstance(t0, (int, float)):
        t0 = max(0, m[0]['start'] - (0.2 if t0 == 'auto' else 0))
    t1 = m[-1]['end']
    out = os.path.join(tmp, f'seg{i}.mp4')
    vf = seg.get('filter', '') + (',' if seg.get('filter') else '')
    vf += 'scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:color=0x121212,fps=30,format=yuv420p'
    run(['-ss', f'{t0:.3f}', '-t', f'{t1 - t0:.3f}', '-i', P(seg['video']), '-vf', vf, '-an',
         '-c:v', 'libx264', '-preset', 'medium', '-crf', '17', out])
    d = dur(out)
    for s in m:
        timeline[s['id']] = t + (s['start'] - t0)
    files.append(out)
    t += d
total = t

# 2. voice-over: each scene's WAV starts LEAD seconds after its marker
inputs, filt, labels = [], [], []
for n, (sid, start) in enumerate(timeline.items()):
    inputs += ['-i', P('audio', f'{sid}.wav')]
    ms = int((start + LEAD) * 1000)
    filt.append(f'[{n}:a]adelay={ms}:all=1[a{n}]')
    labels.append(f'[a{n}]')
filt.append(''.join(labels) + f'amix=inputs={len(labels)}:normalize=0:duration=longest,'
            f'loudnorm=I=-16:TP=-1.5:LRA=11,volume=1.4dB,apad=whole_dur={total:.3f},atrim=0:{total:.3f}[aout]')
voice = os.path.join(tmp, 'voice.wav')
run([*inputs, '-filter_complex', ';'.join(filt), '-map', '[aout]', '-ar', '48000', '-ac', '1', voice])

# 3. concat the video, mux, chapters
lst = os.path.join(tmp, 'list.txt')
open(lst, 'w').write(''.join(f"file '{f.replace(chr(92), '/')}'\n" for f in files))
meta = os.path.join(tmp, 'meta.txt')
ch = [(c['title'], timeline[c['scene']]) for c in cfg['chapters']]
with open(meta, 'w', encoding='utf-8') as f:
    f.write(';FFMETADATA1\ntitle=Spotify to MP3 v1.0.0 - quick overview\n')
    for k, (title, st) in enumerate(ch):
        en = ch[k + 1][1] if k + 1 < len(ch) else total
        f.write(f'[CHAPTER]\nTIMEBASE=1/1000\nSTART={int(st * 1000)}\nEND={int(en * 1000)}\ntitle={title}\n')
with open(P('exports', 'chapters.txt'), 'w') as f:
    for title, st in ch:
        f.write(f'{int(st // 60)}:{int(st % 60):02d} {title}\n')
mp4 = P('exports', cfg['name'] + '.mp4')
run(['-f', 'concat', '-safe', '0', '-i', lst, '-i', voice, '-i', meta, '-map', '0:v', '-map', '1:a', '-map_metadata', '2',
     '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-profile:v', 'high', '-pix_fmt', 'yuv420p', '-r', '30',
     '-c:a', 'aac', '-b:a', '160k', '-ac', '2', '-ar', '48000', '-movflags', '+faststart', '-shortest', mp4])

# 4. captions from the on-screen voice-over text, timed by character share of each scene's audio
def split_cue(s, limit=84):
    parts = re.split(r'(?<=[.?!])\s+', s.strip())
    out = []
    for p in parts:
        if len(p) <= limit:
            out.append(p)
            continue
        cut = [m.end() for m in re.finditer(r',\s|\s(?=and\s|with\s|converts\s)', p)]
        mid = min(cut, key=lambda c: abs(c - len(p) / 2)) if cut else p.rfind(' ', 0, len(p) // 2)
        out += [p[:mid].strip(), p[mid:].strip()]
    return out


def wrap(s, w=44):
    if len(s) <= w:
        return s
    sp = [i for i, c in enumerate(s) if c == ' ']
    k = min(sp, key=lambda i: abs(i - len(s) / 2))
    return s[:k] + '\n' + s[k + 1:]


def stamp(x, comma=True):
    h, r = divmod(x, 3600); m, s = divmod(r, 60)
    return f'{int(h):02d}:{int(m):02d}:{int(s):02d}{"," if comma else "."}{int(round((s - int(s)) * 1000)):03d}'.replace('1000', '999')


cues = []
for sid, st in timeline.items():
    text = scenes[sid]['voiceover'].replace('One twenty-eight kilobits', '128 kilobits')
    pieces = split_cue(text)
    speech_start = st + LEAD + 0.1
    speech_len = durations[sid] - 0.25
    total_chars = sum(len(p) for p in pieces)
    cur = speech_start
    for p in pieces:
        d = speech_len * len(p) / total_chars
        cues.append((cur, cur + d - 0.05, wrap(p)))
        cur += d
base = P('captions', cfg['name'])
with open(base + '.srt', 'w', encoding='utf-8') as f:
    for n, (a, b, tx) in enumerate(cues, 1):
        f.write(f'{n}\n{stamp(a)} --> {stamp(b)}\n{tx}\n\n')
with open(base + '.vtt', 'w', encoding='utf-8') as f:
    f.write('WEBVTT\n\n')
    for a, b, tx in cues:
        f.write(f'{stamp(a, False)} --> {stamp(b, False)}\n{tx}\n\n')
json.dump({'video': cfg['name'] + '.mp4', 'duration': round(total, 2),
           'scenes': [{'id': k, 'start': round(v, 3)} for k, v in timeline.items()]},
          open(P('exports', 'timeline.json'), 'w'), indent=2)
print(f'exported {mp4}  {total:.1f}s, {len(cues)} caption cues')
