
pipeline {
    agent any

    

    environment {
        TAG = "${BUILD_NUMBER}"
        IMAGE = "docker.io/debabratap/jenkinsnotesapp"
    }

    stages {
      

        stage('Build') {
            steps {
                echo 'Building Docker image'

                sh '''
                    docker build \
                        -t "$IMAGE:$TAG" \
                        -t "$IMAGE:latest" .
                '''
            }
        }

        stage('Push to Docker Hub') {
            steps {
                echo 'Pushing images to Docker Hub'

                withCredentials([
                    usernamePassword(
                        credentialsId: 'dockerhub',
                        usernameVariable: 'DOCKERHUB_USER',
                        passwordVariable: 'DOCKERHUB_PWD'
                    )
                ]) {
                    sh '''
                        set +x

                        echo "$DOCKERHUB_PWD" |
                            docker login \
                            -u "$DOCKERHUB_USER" \
                            --password-stdin

                        docker push "$IMAGE:$TAG"
                        docker push "$IMAGE:latest"

                        docker logout
                    '''
                }
            }
        }

        stage('Archive Deployment Info') {
            steps {
                sh '''
                    cat > "deploy-info${BUILD_NUMBER}.txt" <<EOF
build: ${BUILD_NUMBER}
image: ${IMAGE}:${TAG}
commit: $(git rev-parse HEAD)
branch: ${BRANCH_NAME:-${GIT_BRANCH:-unknown}}
time: $(date -u +"%Y-%m-%dT%H:%M:%SZ")
url: ${BUILD_URL}
EOF
                '''

                archiveArtifacts(
                    artifacts: "deploy-info${BUILD_NUMBER}.txt",
                    fingerprint: true,
                    followSymlinks: false
                )
            }
        }

        stage('Deploy Application') {
            steps {
                echo 'Deploying Flask application'

                sh '''
                    docker pull "$IMAGE:$TAG"

                    docker rm -f jenkinsnotesapp || true

                    docker run -d \
                        --restart unless-stopped \
                        --name jenkinsflaskapp \
                        -p 3003:3000 \
                        "$IMAGE:$TAG"
                '''
            }
        }

        stage('Cleanup Workspace') {
            steps {
                echo 'Cleaning workspace'
                cleanWs()
            }
        }
    }

    post {
        success {
            echo "Build ${env.BUILD_NUMBER} was successful"
        }

        failure {
            echo "Build ${env.BUILD_NUMBER} failed"
        }
    }
}
