import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: "Aucun fichier trouvé" }, { status: 400 });
    }

    // Save to temp directory
    const tempDir = os.tmpdir();
    const inputExt = path.extname(file.name);
    const inputId = Math.random().toString(36).substring(7);
    const inputFileName = `input_${inputId}${inputExt}`;
    const inputFilePath = path.join(tempDir, inputFileName);
    
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(inputFilePath, buffer);
    
    // Ensure public potree directory exists
    const publicProcessedDir = path.join(process.cwd(), 'public', 'potree', inputId);
    if (!fs.existsSync(publicProcessedDir)) {
      fs.mkdirSync(publicProcessedDir, { recursive: true });
    }
    
    const potreeExePath = path.join(process.cwd(), 'bin', 'PotreeConverter', 'PotreeConverter_windows_x64', 'PotreeConverter.exe');
    
    // Execute PotreeConverter to generate octree AND a ready-to-use web viewer page
    const command = `"${potreeExePath}" "${inputFilePath}" -o "${publicProcessedDir}" --generate-page index`;
    
    console.log(`Command execution: ${command}`);
    
    // Max buffer 100MB just in case, explicitly pass CWD to Potree working dir
    const { stdout, stderr } = await execAsync(command, { 
      maxBuffer: 1024 * 1024 * 100,
      cwd: path.dirname(potreeExePath) 
    });
    console.log('Python processing output:', stdout);
    if (stderr) console.error('Python processing stderr:', stderr);
    
    // Clean up input file
    try {
      fs.unlinkSync(inputFilePath);
    } catch (e) {
      console.error(e);
    }
    
    if (fs.existsSync(path.join(publicProcessedDir, 'index.html'))) {
      return NextResponse.json({ 
        url: `/potree/${inputId}/index.html`,
        originalName: file.name,
        processedSize: 0 // Potree directory is complex
      });
    } else {
      throw new Error("PotreeConverter n'a pas pu créer l'Octree.");
    }

  } catch (error: any) {
    console.error("Error processing point cloud:", error);
    return NextResponse.json(
      { error: "Erreur lors du traitement du fichier: " + error.message },
      { status: 500 }
    );
  }
}
