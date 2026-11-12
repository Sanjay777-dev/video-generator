from pathlib import Path

import torch
from diffusers import DiffusionPipeline

from app.config import settings
from app.providers.base import VideoProvider, VideoRequest


class LocalProvider(VideoProvider):
    """Wan2.1 text-to-video and image-to-video pipelines for CUDA-capable machines."""

    def __init__(self) -> None:
        if not torch.cuda.is_available():
            raise RuntimeError("PROVIDER=local requires a CUDA-enabled PyTorch installation and NVIDIA GPU.")
        self.pipeline = None
        self.image_pipeline = None

    def generate(self, request: VideoRequest, output_path: Path) -> None:
        from diffusers.utils import export_to_video

        if request.image_path:
            if self.image_pipeline is None:
                self.image_pipeline = DiffusionPipeline.from_pretrained(
                    settings.local_i2v_model_id,
                    torch_dtype=torch.float16,
                ).to(settings.local_device)
            from diffusers.utils import load_image

            image = load_image(str(request.image_path))
            result = self.image_pipeline(
                image=image,
                prompt=request.prompt,
                negative_prompt=request.negative_prompt or None,
                num_frames=max(24, request.duration * 16),
                height=480,
                width=832 if request.aspect_ratio == "16:9" else 480,
                generator=_generator(request.seed),
            )
            export_to_video(result.frames[0], str(output_path), fps=16)
            return

        if self.pipeline is None:
            self.pipeline = DiffusionPipeline.from_pretrained(
                settings.local_model_id,
                torch_dtype=torch.float16,
            ).to(settings.local_device)
        width, height = _dimensions(request.aspect_ratio, request.resolution)
        result = self.pipeline(
            prompt=request.prompt,
            negative_prompt=request.negative_prompt or None,
            num_frames=max(24, request.duration * 16),
            height=height,
            width=width,
            generator=_generator(request.seed),
        )
        export_to_video(result.frames[0], str(output_path), fps=16)


def _generator(seed: int | None) -> torch.Generator:
    generator = torch.Generator(device=settings.local_device)
    if seed is not None:
        generator.manual_seed(seed)
    return generator


def _dimensions(aspect_ratio: str, resolution: str) -> tuple[int, int]:
    short_side = 480 if resolution == "480p" else 720
    ratio_width, ratio_height = {
        "16:9": (16, 9),
        "9:16": (9, 16),
        "1:1": (1, 1),
    }[aspect_ratio]
    if ratio_width >= ratio_height:
        height = short_side
        width = int(height * ratio_width / ratio_height)
    else:
        width = short_side
        height = int(width * ratio_height / ratio_width)
    return width - width % 16, height - height % 16
