# FFmpeg (`gou/ffmpeg`)

> **Process group:** `ffmpeg` — registered in `gou/ffmpeg/process.go`

| Process | Args | Returns | Description |
|---------|------|---------|-------------|
| `ffmpeg.Info` | `filePath` | `MediaInfo` | Duration, dimensions, codecs, file size |
| `ffmpeg.Convert` | `inputPath`, `config` | `string` | Convert media format, return output path |
| `ffmpeg.ExtractAudio` | `inputPath`, `config?` | `string` | Extract audio track from video, return output path |
| `ffmpeg.ChunkAudio` | `inputPath`, `config?` | `ChunkResult` | Split audio into chunks by silence detection |

**Config (`ffmpeg.Convert`):** `format` (required), `output_path`, `bitrate`, `sample_rate`.
**Config (`ffmpeg.ExtractAudio`):** `format` (default: "mp3"), `output_path`, `bitrate`, `sample_rate`.
**Config (`ffmpeg.ChunkAudio`):** `max_duration` (default: 600s), `max_size` (default: 25MB), `silence_threshold`, `output_dir`, `format`.

**Note:** Auto-detects ffmpeg/ffprobe paths. Graceful fallback if ffmpeg not installed (log warning, no panic).

**Keeper usage:** Video Parsing — `ffmpeg.ExtractAudio` → audio; Audio Transcription — `ffmpeg.ChunkAudio` (25MB Whisper limit) → STT → Markdown.
