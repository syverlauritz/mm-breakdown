# Memory Maker Shot Extraction

This tool extracts individual shots from the "Memory Maker" video and saves them as high-quality images.

## Setup

1. Make sure you have Python 3.8 or later installed
2. Install the required packages:
   ```
   pip install -r requirements.txt
   ```

## Usage

1. Place your video file in the `media` folder
2. Run the extraction script:
   ```
   python extract_shots.py
   ```

## Output

The script will create:
- An `output/shots` folder containing all extracted shots as JPG images
- An `output/shots_info.csv` file with shot information including:
  - Shot number
  - Frame number
  - Timestamp
  - File name

## Notes

- The script uses a threshold-based approach to detect shot changes
- Each shot is saved as a high-quality JPG image
- Progress is displayed in the console during extraction 