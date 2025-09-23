#!/usr/bin/env node

// startup.js - Server startup script with dependency checks
const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🚀 AI Video Dubbing Server - Startup Check\n');

// Check Node.js version
const nodeVersion = process.versions.node;
const majorVersion = parseInt(nodeVersion.split('.')[0]);
if (majorVersion < 14) {
    console.error('❌ Node.js version 14 or higher is required. Current version:', nodeVersion);
    process.exit(1);
}
console.log('✅ Node.js version:', nodeVersion);

// Check if .env file exists
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
    console.warn('\n⚠️  No .env file found!');
    console.log('Creating .env from .env.example...\n');
    
    const envExamplePath = path.join(__dirname, '.env.example');
    if (fs.existsSync(envExamplePath)) {
        fs.copyFileSync(envExamplePath, envPath);
        console.log('📝 .env file created. Please edit it with your API keys.\n');
    } else {
        console.error('❌ .env.example file not found. Please create .env file manually.');
        process.exit(1);
    }
}

// Load environment variables
require('dotenv').config();

// Check required environment variables
const requiredEnvVars = [
    'PORT',
    'GOOGLE_TRANSLATE_API_KEY'
];

const optionalEnvVars = [
    'GOOGLE_APPLICATION_CREDENTIALS',
    'ASSEMBLY_AI_API_KEY',
    'HUGGINGFACE_API_KEY'
];

console.log('\n📋 Environment Variables Check:');
console.log('================================');

let missingRequired = [];
requiredEnvVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName}: Set`);
    } else {
        console.log(`❌ ${varName}: Missing (REQUIRED)`);
        missingRequired.push(varName);
    }
});

console.log('\n📋 Optional Services:');
optionalEnvVars.forEach(varName => {
    if (process.env[varName]) {
        console.log(`✅ ${varName}: Set`);
    } else {
        console.log(`⚠️  ${varName}: Not set (optional)`);
    }
});

if (missingRequired.length > 0) {
    console.error('\n❌ Missing required environment variables:', missingRequired.join(', '));
    console.log('Please update your .env file with the required API keys.\n');
    console.log('Instructions:');
    console.log('1. Google Translate API: https://cloud.google.com/translate/docs/setup');
    console.log('2. Google Cloud Speech (optional): https://cloud.google.com/speech-to-text/docs/quickstart');
    process.exit(1);
}

// Check if ffmpeg is installed
console.log('\n📋 System Dependencies:');
console.log('=======================');

const checkCommand = (command, callback) => {
    const isWindows = process.platform === 'win32';
    const which = isWindows ? 'where' : 'which';
    
    const child = spawn(which, [command], { shell: true });
    
    child.on('close', (code) => {
        if (code === 0) {
            console.log(`✅ ${command}: Installed`);
            callback(true);
        } else {
            console.log(`❌ ${command}: Not found`);
            callback(false);
        }
    });
};

checkCommand('ffmpeg', (ffmpegInstalled) => {
    checkCommand('ffprobe', (ffprobeInstalled) => {
        if (!ffmpegInstalled || !ffprobeInstalled) {
            console.error('\n❌ ffmpeg and ffprobe are required but not installed.');
            console.log('\nInstallation instructions:');
            console.log('- Ubuntu/Debian: sudo apt-get install ffmpeg');
            console.log('- MacOS: brew install ffmpeg');
            console.log('- Windows: Download from https://ffmpeg.org/download.html');
            process.exit(1);
        }
        
        // Check if node_modules exists
        console.log('\n📋 Dependencies Check:');
        console.log('=====================');
        
        const nodeModulesPath = path.join(__dirname, 'node_modules');
        if (!fs.existsSync(nodeModulesPath)) {
            console.log('⚠️  node_modules not found. Installing dependencies...\n');
            
            const npm = spawn('npm', ['install'], { 
                stdio: 'inherit',
                shell: true 
            });
            
            npm.on('close', (code) => {
                if (code === 0) {
                    console.log('\n✅ Dependencies installed successfully!');
                    startServer();
                } else {
                    console.error('\n❌ Failed to install dependencies');
                    process.exit(1);
                }
            });
        } else {
            console.log('✅ node_modules: Found');
            
            // Check for specific required modules
            const requiredModules = [
                'express',
                'multer',
                'cors',
                'axios',
                'dotenv'
            ];
            
            let missingModules = [];
            requiredModules.forEach(module => {
                const modulePath = path.join(nodeModulesPath, module);
                if (!fs.existsSync(modulePath)) {
                    missingModules.push(module);
                }
            });
            
            if (missingModules.length > 0) {
                console.log(`\n⚠️  Missing modules: ${missingModules.join(', ')}`);
                console.log('Installing missing dependencies...\n');
                
                const npm = spawn('npm', ['install'], { 
                    stdio: 'inherit',
                    shell: true 
                });
                
                npm.on('close', (code) => {
                    if (code === 0) {
                        console.log('\n✅ Dependencies updated successfully!');
                        startServer();
                    } else {
                        console.error('\n❌ Failed to install dependencies');
                        process.exit(1);
                    }
                });
            } else {
                console.log('✅ All required modules: Installed');
                startServer();
            }
        }
    });
});

function startServer() {
    console.log('\n🎬 Starting AI Video Dubbing Server...\n');
    console.log('═'.repeat(50));
    
    // Determine which server file exists
    const possiblePaths = [
        path.join(__dirname, 'src', 'api', 'server.js'),
        path.join(__dirname, 'server', 'server.js'),
        path.join(__dirname, 'server.js')
    ];
    
    let serverPath = null;
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            serverPath = p;
            break;
        }
    }
    
    if (!serverPath) {
        console.error('❌ Server file not found in expected locations:', possiblePaths);
        process.exit(1);
    }
    
    console.log(`📁 Starting server from: ${path.relative(__dirname, serverPath)}\n`);
    
    // Start the server
    require(serverPath);
}