from config.settings import settings
from backend.utils.bbox import calculate_safe_zone, inches_to_pixels
from backend.utils.color_utils import hex_to_rgb, contrast_ratio, best_text_color


def test_environment_assets_and_utilities():
    fonts = list(settings.font_dir.glob("*.ttf"))
    assert len(fonts) >= 1

    canvas = inches_to_pixels(48, 24, 300)
    assert (canvas.width, canvas.height) == (14400, 7200)

    safe = calculate_safe_zone(canvas.width, canvas.height)
    assert safe.width < canvas.width
    assert safe.height < canvas.height

    assert hex_to_rgb("#FF9933") == (255, 153, 51)
    assert contrast_ratio("#000000", "#FFFFFF") == 21
    assert best_text_color("#FF9933") == "#000000"
