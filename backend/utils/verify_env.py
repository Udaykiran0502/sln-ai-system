import sys

def verify_imports():
    packages = [
        "langgraph", "langchain", "openai", "anthropic", "google.generativeai",
        "PIL", "uharfbuzz", "cv2", "rembg", "numpy", "pandas",
        "dotenv", "fastapi", "uvicorn", "sqlalchemy"
    ]
    
    missing = []
    for pkg in packages:
        try:
            if pkg == "google.generativeai":
                import google.generativeai
            elif pkg == "PIL":
                import PIL
            elif pkg == "cv2":
                import cv2
            elif pkg == "dotenv":
                import dotenv
            else:
                __import__(pkg)
            print(f"✅ Successfully imported {pkg}")
        except ImportError:
            missing.append(pkg)
            print(f"❌ Failed to import {pkg}")
            
    if missing:
        print(f"\nMissing packages: {', '.join(missing)}")
        print("Please install them using: pip install -r requirements.txt")
        return False
    return True

def test_uharfbuzz_telugu():
    try:
        import uharfbuzz as hb
        from PIL import ImageFont
        
        print("\n--- Testing uharfbuzz with Telugu text ---")
        text = "నమస్కారం" # Namaskaram
        print(f"Input text: {text}")
        
        buffer = hb.Buffer()
        buffer.add_str(text)
        buffer.guess_segment_properties()
        
        print("✅ HarfBuzz buffer created and populated successfully.")
        print(f"Buffer direction: {buffer.direction}")
        print(f"Buffer script: {buffer.script}")
        print(f"Buffer language: {buffer.language}")
        
        print("Note: Full shaping test with glyph layout calculation requires a valid TTF font file.")
        print("To complete the test, load a font face and shape the buffer.")
        
        return True
    except Exception as e:
        print(f"❌ HarfBuzz test failed: {e}")
        return False

if __name__ == "__main__":
    print("Starting environment verification...")
    imports_ok = verify_imports()
    hb_ok = test_uharfbuzz_telugu()
    
    if imports_ok and hb_ok:
        print("\n✅ All tests passed. Environment is ready.")
        sys.exit(0)
    else:
        print("\n❌ Some tests failed. Please check the output above.")
        sys.exit(1)
