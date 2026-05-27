import logging
import threading
from typing import List
from backend.utils.patch_merger import Patch
from config.settings import settings

logger = logging.getLogger(__name__)

# Lazy loaded translation models
_en2indic_model = None
_indic2en_model = None
_tokenizer = None
_model_lock = threading.Lock()

def _load_models():
    """Lazy load IndicTrans2 models."""
    global _en2indic_model, _indic2en_model, _tokenizer
    if _en2indic_model is None:
        with _model_lock:
            if _en2indic_model is None:
                try:
                    logger.info(f"Loading IndicTrans2 model from {settings.indictrans_model}")
                    from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
                    
                    _tokenizer = AutoTokenizer.from_pretrained(settings.indictrans_model, trust_remote_code=True)
                    _en2indic_model = AutoModelForSeq2SeqLM.from_pretrained(settings.indictrans_model, trust_remote_code=True)
                    
                    # For a full implementation, we'd also load the indic-en model if bidirectional translation is needed
                    # _indic2en_model = AutoModelForSeq2SeqLM.from_pretrained("ai4bharat/indictrans2-indic-en-dist-200M", trust_remote_code=True)
                except ImportError:
                    logger.warning("transformers not installed. Fallback to copywriter needed.")
                except Exception as e:
                    logger.error(f"Failed to load IndicTrans2 model: {e}")

def translate_en2te(text: str) -> str:
    """Translate English to Telugu using IndicTrans2."""
    if not text:
        return ""
        
    _load_models()
    if _en2indic_model is None or _tokenizer is None:
        logger.warning("IndicTrans2 model not available. Returning original text.")
        return text
        
    try:
        # Format for IndicTrans2: src_lang=eng_Latn, tgt_lang=tel_Telu
        batch = _tokenizer(text, return_tensors="pt")
        generated_tokens = _en2indic_model.generate(**batch, max_length=256)
        result = _tokenizer.batch_decode(generated_tokens, skip_special_tokens=True)[0]
        
        # Verify Telugu Unicode block (U+0C00–U+0C7F)
        has_telugu = any('\u0C00' <= c <= '\u0C7F' for c in result)
        if not has_telugu:
            logger.warning(f"Translation output does not contain Telugu characters: {result}")
            
        return result
    except Exception as e:
        logger.error(f"Translation failed: {e}")
        return text

def indictrans_agent(state: dict) -> List[Patch]:
    """
    Telugu-English Translation Agent.
    Translates copy from English to Telugu if required.
    Returns patches with translated text.
    """
    parsed = state.get("parsed_order", {})
    copy_data = state.get("copy", {})
    language = parsed.get("language", "telugu")
    
    if language == "english" or not copy_data:
        return []
        
    patches = []
    
    # Check if we need to translate headings
    if "heading_en" in copy_data and "heading_te" not in copy_data:
        translated = translate_en2te(copy_data["heading_en"])
        patches.append(Patch(target_path="copy.heading_te", operation="set", value=translated))
        
    if "subheading" in copy_data and not any('\u0C00' <= c <= '\u0C7F' for c in copy_data["subheading"]):
        translated = translate_en2te(copy_data["subheading"])
        patches.append(Patch(target_path="copy.subheading_te", operation="set", value=translated))
        
    if "tagline" in copy_data and not any('\u0C00' <= c <= '\u0C7F' for c in copy_data["tagline"]):
        translated = translate_en2te(copy_data["tagline"])
        patches.append(Patch(target_path="copy.tagline_te", operation="set", value=translated))
        
    return patches
