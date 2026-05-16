def runCommand(String unixCommand, String windowsCommand) {
    if (isUnix()) {
        sh unixCommand
    } else {
        bat windowsCommand
    }
}

pipeline {
    agent any

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        disableConcurrentBuilds()
    }

    environment {
        CI = 'true'
        NODE_ENV = 'test'
        JWT_SECRET = 'jenkins-ci-secret'
        FRONTEND_URL = 'http://localhost:3000'
        PORT = '5050'
        SKIP_DB = 'true'
    }

    stages {
        stage('Verify Agent') {
            steps {
                script {
                    runCommand(
                        '''
                        set -e
                        node --version
                        node -e "const [major, minor] = process.versions.node.split('.').map(Number); if (Math.sign((major * 100 + minor) - 2019) === -1) { console.error('Node.js 20.19 or newer is required. Current: ' + process.versions.node); process.exit(1); }"
                        npm --version
                        git --version
                        ''',
                        '''
                        node --version
                        node -e "const [major, minor] = process.versions.node.split('.').map(Number); if (Math.sign((major * 100 + minor) - 2019) === -1) { console.error('Node.js 20.19 or newer is required. Current: ' + process.versions.node); process.exit(1); }"
                        npm --version
                        git --version
                        '''
                    )
                }
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Server Dependencies') {
                    steps {
                        dir('server') {
                            script {
                                runCommand('npm ci', 'npm ci')
                            }
                        }
                    }
                }

                stage('Client Dependencies') {
                    steps {
                        dir('client') {
                            script {
                                runCommand('npm ci', 'npm ci')
                            }
                        }
                    }
                }
            }
        }

        stage('Validate Application') {
            parallel {
                stage('Server Syntax') {
                    steps {
                        dir('server') {
                            script {
                                runCommand('node --check server.js', 'node --check server.js')
                            }
                        }
                    }
                }

                stage('Client Build') {
                    steps {
                        dir('client') {
                            script {
                                runCommand('npm run build', 'npm run build')
                            }
                        }
                    }
                }
            }
        }

        stage('API Smoke Test') {
            steps {
                dir('server') {
                    script {
                        runCommand(
                            '''
                            set -e
                            rm -f server-smoke.log server.pid
                            PORT=5050 SKIP_DB=true node server.js > server-smoke.log 2>&1 &
                            echo $! > server.pid
                            trap 'kill $(cat server.pid) 2>/dev/null || true' EXIT

                            for i in $(seq 1 20); do
                                if curl -fsS http://127.0.0.1:5050/api/health; then
                                    exit 0
                                fi
                                sleep 1
                            done

                            cat server-smoke.log
                            exit 1
                            ''',
                            '''
                            @echo off
                            setlocal enabledelayedexpansion
                            if exist server-smoke.log del server-smoke.log
                            start /B cmd /C "set PORT=5050&& set SKIP_DB=true&& node server.js > server-smoke.log 2>&1"

                            for /L %%i in (1,1,20) do (
                                curl -fsS http://127.0.0.1:5050/api/health
                                if not errorlevel 1 goto healthy
                                powershell -NoProfile -Command "Start-Sleep -Seconds 1"
                            )

                            type server-smoke.log
                            exit /b 1

                            :healthy
                            for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5050') do taskkill /PID %%a /F >nul 2>nul
                            exit /b 0
                            '''
                        )
                    }
                }
            }
        }

        stage('Docker Validation') {
            when {
                expression { return env.SKIP_DOCKER != 'true' }
            }
            steps {
                script {
                    runCommand(
                        '''
                        set -e
                        if ! docker info >/dev/null 2>&1; then
                            echo "Docker daemon is not running. Skipping Docker validation."
                            exit 0
                        fi
                        docker compose config
                        docker build -t vendor-po-manager-server:${BUILD_NUMBER} ./server
                        docker build -t vendor-po-manager-client:${BUILD_NUMBER} ./client
                        ''',
                        '''
                        docker info >nul 2>nul
                        if errorlevel 1 (
                            echo Docker daemon is not running. Skipping Docker validation.
                            exit /b 0
                        )
                        docker compose config
                        docker build -t vendor-po-manager-server:%BUILD_NUMBER% ./server
                        docker build -t vendor-po-manager-client:%BUILD_NUMBER% ./client
                        '''
                    )
                }
            }
        }

        stage('Deploy') {
            when {
                anyOf {
                    branch 'main'
                    expression { env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main' }
                }
            }
            steps {
                withCredentials([
                    string(credentialsId: 'render-deploy-hook-url', variable: 'RENDER_DEPLOY_HOOK_URL'),
                    string(credentialsId: 'vercel-deploy-hook-url', variable: 'VERCEL_DEPLOY_HOOK_URL')
                ]) {
                    script {
                        runCommand(
                            '''
                            set -e
                            if [ -n "$RENDER_DEPLOY_HOOK_URL" ]; then
                                curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"
                                echo "Render deploy hook triggered."
                            fi

                            if [ -n "$VERCEL_DEPLOY_HOOK_URL" ]; then
                                curl -fsS -X POST "$VERCEL_DEPLOY_HOOK_URL"
                                echo "Vercel deploy hook triggered."
                            fi
                            ''',
                            '''
                            if not "%RENDER_DEPLOY_HOOK_URL%"=="" (
                                curl -fsS -X POST "%RENDER_DEPLOY_HOOK_URL%"
                                echo Render deploy hook triggered.
                            )

                            if not "%VERCEL_DEPLOY_HOOK_URL%"=="" (
                                curl -fsS -X POST "%VERCEL_DEPLOY_HOOK_URL%"
                                echo Vercel deploy hook triggered.
                            )
                            '''
                        )
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'client/dist/**, server/server-smoke.log', allowEmptyArchive: true
        }
    }
}
