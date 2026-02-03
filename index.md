---
layout: default
title: GHMC Civic Services
---

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GHMC Civic Services - Welcome</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 500px;
            width: 100%;
        }
        h1 {
            color: #333;
            margin-bottom: 10px;
            font-size: 28px;
        }
        .subtitle {
            color: #666;
            margin-bottom: 30px;
            font-size: 16px;
        }
        .btn {
            display: inline-block;
            padding: 15px 30px;
            margin: 10px;
            border-radius: 8px;
            text-decoration: none;
            font-weight: 600;
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
            font-size: 16px;
        }
        .btn-primary {
            background: #667eea;
            color: white;
        }
        .btn-primary:hover {
            background: #5a6fd8;
            transform: translateY(-2px);
        }
        .btn-secondary {
            background: #28a745;
            color: white;
        }
        .btn-secondary:hover {
            background: #218838;
            transform: translateY(-2px);
        }
        .btn-outline {
            background: transparent;
            color: #667eea;
            border: 2px solid #667eea;
        }
        .btn-outline:hover {
            background: #667eea;
            color: white;
        }
        .features {
            margin-top: 30px;
            text-align: left;
        }
        .feature {
            margin: 10px 0;
            color: #555;
        }
        .feature::before {
            content: "✅ ";
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏛️ GHMC Civic Services</h1>
        <p class="subtitle">Complete Digital Platform for Greater Hyderabad Municipal Corporation</p>
        
        <div>
            <a href="index.html?access=guest" class="btn btn-secondary">🚀 Start as Guest</a>
            <a href="auth-system.html" class="btn btn-primary">🔐 Management Login</a>
        </div>
        
        <div>
            <a href="industrial-map-google.html" class="btn btn-outline">🗺️ Industrial Map</a>
            <a href="ai-module.html" class="btn btn-outline">🤖 AI Assistant</a>
        </div>
        
        <div class="features">
            <div class="feature">9 Civic Services Available</div>
            <div class="feature">AI-Powered Grievance Handling</div>
            <div class="feature">Real-time Industrial Mapping</div>
            <div class="feature">Role-Based Access Control</div>
            <div class="feature">Mobile-First Design</div>
            <div class="feature">Offline Capability</div>
        </div>
    </div>

    <script>
        // Auto-redirect to auth system after 10 seconds if no action
        setTimeout(() => {
            if (confirm('Would you like to proceed to the login page?')) {
                window.location.href = 'auth-system.html';
            }
        }, 10000);
    </script>
</body>
</html>