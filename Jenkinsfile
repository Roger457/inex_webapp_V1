pipeline {
    agent any

    // ── Environment variables available to all stages ──────────────────────
    environment {
        // Docker image name for the INEX app
        IMAGE_NAME = 'inex-webapp'
        IMAGE_TAG  = "build-${env.BUILD_NUMBER}"

        // SonarQube server name (must match the name configured in
        // Jenkins → Manage Jenkins → Configure System → SonarQube servers)
        SONAR_SERVER = 'SonarQube'
    }

    // ── Build triggers ──────────────────────────────────────────────────────
    triggers {
        // Poll GitHub every minute for new commits.
        // Replace with a webhook once ngrok / a public URL is available.
        pollSCM('* * * * *')
    }

    stages {

        // ── Stage 1: Checkout ─────────────────────────────────────────────
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code from GitHub...'
                checkout scm
            }
        }

        // ── Stage 2: Install Dependencies ────────────────────────────────
        stage('Install Dependencies') {
            steps {
                echo '📦 Installing Node.js dependencies...'
                // Use the NodeJS tool configured in Jenkins
                // Jenkins → Manage Jenkins → Tools → NodeJS installations
                // Add an installation named "NodeJS-20"
                nodejs(nodeJSInstallationName: 'NodeJS-20') {
                    sh 'npm ci'
                }
            }
        }

        // ── Stage 3: Lint ────────────────────────────────────────────────
        stage('Lint') {
            steps {
                echo '🔍 Running ESLint...'
                nodejs(nodeJSInstallationName: 'NodeJS-20') {
                    // next lint exits with code 1 on errors — fails the build
                    sh 'npm run lint'
                }
            }
        }

        // ── Stage 4: Type Check ───────────────────────────────────────────
        stage('Type Check') {
            steps {
                echo '🔷 Running TypeScript type check...'
                nodejs(nodeJSInstallationName: 'NodeJS-20') {
                    sh 'npx tsc --noEmit'
                }
            }
        }

        // ── Stage 5: SonarQube Analysis ───────────────────────────────────
        stage('SonarQube Analysis') {
            steps {
                echo '📊 Running SonarQube code quality analysis...'
                // withSonarQubeEnv injects SONAR_TOKEN and SONAR_HOST_URL
                // automatically from the Jenkins SonarQube server config
                withSonarQubeEnv("${SONAR_SERVER}") {
                    nodejs(nodeJSInstallationName: 'NodeJS-20') {
                        sh '''
                            npx sonar-scanner \
                              -Dsonar.projectKey=inex-webapp \
                              -Dsonar.projectName="INEX Internship Discovery Platform" \
                              -Dsonar.projectVersion=1.0 \
                              -Dsonar.sources=src \
                              -Dsonar.exclusions="node_modules/**,.next/**,public/**" \
                              -Dsonar.typescript.tsconfigPath=tsconfig.json \
                              -Dsonar.sourceEncoding=UTF-8
                        '''
                    }
                }
            }
        }

        // ── Stage 6: Quality Gate ─────────────────────────────────────────
        stage('Quality Gate') {
            steps {
                echo '🚦 Waiting for SonarQube Quality Gate result...'
                // Waits up to 5 minutes for SonarQube to process the analysis.
                // If the Quality Gate fails, the pipeline is marked as failed.
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        // ── Stage 7: Docker Build ─────────────────────────────────────────
        stage('Docker Build') {
            steps {
                echo "🐳 Building Docker image: ${IMAGE_NAME}:${IMAGE_TAG}..."
                // Read build-time env vars from Jenkins credentials or env
                // Configure these in Jenkins → Manage Jenkins → Credentials
                withCredentials([
                    string(credentialsId: 'NEXT_PUBLIC_SUPABASE_URL',      variable: 'SUPABASE_URL'),
                    string(credentialsId: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', variable: 'SUPABASE_ANON_KEY'),
                    string(credentialsId: 'NEXT_PUBLIC_MAPTILER_KEY',      variable: 'MAPTILER_KEY'),
                    string(credentialsId: 'NEXT_PUBLIC_SITE_URL',          variable: 'SITE_URL')
                ]) {
                    sh """
                        docker build \
                          --build-arg NEXT_PUBLIC_SUPABASE_URL=\$SUPABASE_URL \
                          --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=\$SUPABASE_ANON_KEY \
                          --build-arg NEXT_PUBLIC_MAPTILER_KEY=\$MAPTILER_KEY \
                          --build-arg NEXT_PUBLIC_SITE_URL=\$SITE_URL \
                          -t ${IMAGE_NAME}:${IMAGE_TAG} \
                          -t ${IMAGE_NAME}:latest \
                          .
                    """
                }
            }
        }

        // ── Stage 8: Docker Smoke Test ────────────────────────────────────
        stage('Smoke Test') {
            steps {
                echo '💨 Running smoke test on Docker container...'
                sh """
                    # Start the container on a test port
                    docker run -d --name inex-smoke-test \
                      -p 3001:3000 \
                      ${IMAGE_NAME}:${IMAGE_TAG}

                    # Give it 10 seconds to boot
                    sleep 10

                    # Check the app responds with HTTP 200
                    curl --fail --silent --max-time 10 http://localhost:3001 \
                      && echo '✅ Smoke test passed' \
                      || (echo '❌ Smoke test failed' && exit 1)
                """
            }
            post {
                always {
                    // Always clean up the test container
                    sh 'docker rm -f inex-smoke-test || true'
                }
            }
        }
    }

    // ── Post-pipeline actions ───────────────────────────────────────────────
    post {
        success {
            echo """
            ✅ Pipeline completed successfully!
            Image: ${IMAGE_NAME}:${IMAGE_TAG}
            Build: #${env.BUILD_NUMBER}
            """
        }
        failure {
            echo '❌ Pipeline failed. Check the stage logs above for details.'
        }
        always {
            echo '🧹 Cleaning up workspace...'
            cleanWs()
        }
    }
}