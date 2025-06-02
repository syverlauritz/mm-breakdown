import cv2
import numpy as np
import os
import pandas as pd
from datetime import timedelta

def format_timestamp(seconds):
    """Convert seconds to HH:MM:SS format"""
    return str(timedelta(seconds=int(seconds)))

def extract_shots(video_path, output_dir, threshold=30.0):
    """
    Extract shots from video and save them as images
    threshold: minimum difference between frames to consider it a new shot
    """
    # Create output directories
    shots_dir = os.path.join(output_dir, 'shots')
    os.makedirs(shots_dir, exist_ok=True)
    
    # Open video
    cap = cv2.VideoCapture(video_path)
    if not cap.isOpened():
        print("Error: Could not open video.")
        return
    
    # Get video properties
    fps = cap.get(cv2.CAP_PROP_FPS)
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Initialize variables
    shot_frames = []
    prev_frame = None
    shot_count = 0
    frame_count = 0
    
    print("Starting shot extraction...")
    
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        frame_count += 1
        
        # Convert frame to grayscale
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        
        if prev_frame is not None:
            # Calculate difference between frames
            diff = cv2.absdiff(gray, prev_frame)
            non_zero_count = np.count_nonzero(diff)
            
            # If difference is significant, consider it a new shot
            if non_zero_count > threshold:
                # Save the first frame of the shot
                shot_path = os.path.join(shots_dir, f'shot_{shot_count:04d}.jpg')
                cv2.imwrite(shot_path, frame)
                
                # Calculate timestamp
                timestamp = frame_count / fps
                shot_frames.append({
                    'shot_number': shot_count,
                    'frame_number': frame_count,
                    'timestamp': timestamp,
                    'timestamp_formatted': format_timestamp(timestamp),
                    'file_name': f'shot_{shot_count:04d}.jpg'
                })
                
                shot_count += 1
                print(f"Extracted shot {shot_count} at {format_timestamp(timestamp)}")
        
        prev_frame = gray
        
        # Progress update
        if frame_count % 100 == 0:
            progress = (frame_count / total_frames) * 100
            print(f"Progress: {progress:.1f}%")
    
    # Create CSV with shot information
    df = pd.DataFrame(shot_frames)
    csv_path = os.path.join(output_dir, 'shots_info.csv')
    df.to_csv(csv_path, index=False)
    
    cap.release()
    print(f"\nExtraction complete! {shot_count} shots extracted.")
    print(f"Shots saved to: {shots_dir}")
    print(f"Shot information saved to: {csv_path}")

if __name__ == "__main__":
    video_path = "media/Memory Maker.mp4"
    output_dir = "output"
    extract_shots(video_path, output_dir) 