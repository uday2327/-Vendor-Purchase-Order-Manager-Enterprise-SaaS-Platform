pipeline {
    agent any

    environment {
        CI = 'true'
    }

    stages {
        stage('Install Server Dependencies') {
            steps {
                dir('server') {
                    script {
                        if (isUnix()) {
                            sh 'npm ci'
                        } else {
                            bat 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Check Server Syntax') {
            steps {
                dir('server') {
                    script {
                        if (isUnix()) {
                            sh 'node --check server.js'
                        } else {
                            bat 'node --check server.js'
                        }
                    }
                }
            }
        }

        stage('Install Client Dependencies') {
            steps {
                dir('client') {
                    script {
                        if (isUnix()) {
                            sh 'npm ci'
                        } else {
                            bat 'npm ci'
                        }
                    }
                }
            }
        }

        stage('Build Client') {
            steps {
                dir('client') {
                    script {
                        if (isUnix()) {
                            sh 'npm run build'
                        } else {
                            bat 'npm run build'
                        }
                    }
                }
            }
        }

        stage('Deploy Hooks') {
            when {
                expression {
                    env.BRANCH_NAME == 'main' || env.GIT_BRANCH == 'origin/main'
                }
            }
            steps {
                withCredentials([
                    string(credentialsId: 'render-deploy-hook-url', variable: 'RENDER_DEPLOY_HOOK_URL'),
                    string(credentialsId: 'vercel-deploy-hook-url', variable: 'VERCEL_DEPLOY_HOOK_URL')
                ]) {
                    script {
                        if (isUnix()) {
                            sh '''
                            if [ -n "$RENDER_DEPLOY_HOOK_URL" ]; then curl -fsS -X POST "$RENDER_DEPLOY_HOOK_URL"; fi
                            if [ -n "$VERCEL_DEPLOY_HOOK_URL" ]; then curl -fsS -X POST "$VERCEL_DEPLOY_HOOK_URL"; fi
                            '''
                        } else {
                            bat '''
                            if not "%RENDER_DEPLOY_HOOK_URL%"=="" curl -fsS -X POST "%RENDER_DEPLOY_HOOK_URL%"
                            if not "%VERCEL_DEPLOY_HOOK_URL%"=="" curl -fsS -X POST "%VERCEL_DEPLOY_HOOK_URL%"
                            '''
                        }
                    }
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'client/dist/**', allowEmptyArchive: true
        }
    }
}
