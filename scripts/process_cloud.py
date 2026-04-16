import sys
import os
import laspy
import numpy as np

def process_file(input_path, output_path, target_points=500000):
    print(f"Reading {input_path}...", flush=True)
    
    try:
        if not os.path.exists(input_path):
            print(f"Error: Input file {input_path} does not exist.", flush=True)
            return False

        with laspy.open(input_path) as fh:
            header = fh.header
            total_points = header.point_count
            print(f"Total points: {total_points}", flush=True)
            
            if total_points <= target_points:
                print("Point count is within limits, just converting to LAS.", flush=True)
                # Ensure output directory exists
                os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
                
                # Copy properties
                new_header = laspy.LasHeader(point_format=header.point_format, version=header.version)
                new_header.offsets = header.offsets
                new_header.scales = header.scales
                
                with laspy.open(output_path, mode="w", header=new_header) as fh_out:
                    for chunk in fh.chunk_iterator(1_000_000):
                        fh_out.append_points(chunk)
                        
                print(f"Successfully created {output_path}", flush=True)
                return True
                
            skip_factor = int(total_points / target_points)
            print(f"Applying decimation with skip factor: {skip_factor}", flush=True)
            
            # Create a completely new header copying scale/offset
            new_header = laspy.LasHeader(point_format=header.point_format, version=header.version)
            new_header.offsets = header.offsets
            new_header.scales = header.scales
            
            os.makedirs(os.path.dirname(os.path.abspath(output_path)), exist_ok=True)
            
            with laspy.open(output_path, mode="w", header=new_header) as fh_out:
                for idx, chunk in enumerate(fh.chunk_iterator(1_000_000)):
                    # Decimate by taking every Nth point
                    decimated_chunk = chunk[::skip_factor]
                    fh_out.append_points(decimated_chunk)
                    if idx % 10 == 0:
                        print(f"Processed chunk {idx}...", flush=True)
                    
        print(f"Successfully created {output_path}", flush=True)
        return True
        
    except Exception as e:
        print(f"Error processing file: {str(e)}", flush=True)
        return False

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_cloud.py <input.laz|las> <output.las>")
        sys.exit(1)
        
    in_file = sys.argv[1]
    out_file = sys.argv[2]
    
    if process_file(in_file, out_file):
        sys.exit(0)
    else:
        sys.exit(1)
