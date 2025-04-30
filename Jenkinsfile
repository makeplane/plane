@Library('jenkins-library@master') _

// define vault configuration
def configuration = [
    engineVersion: 2, 
    timeout: 60,
    vaultCredentialId: 'jenkins-app-role', 
    vaultUrl: 'https://vault.secrets.shipsy.in'
]

// Project Level Configurations
def repository = "plane"
def projectEnv = "prod"

// Config Based configurations
def vaultConfigFilesMap = [
    "CONFIG" : "config.json",
]
def configStoragePath = "config-files"

// Validation Level Configurations
List<String> configFilesList = []
vaultConfigFilesMap.each { envVariable, configFileName ->
    configFilesList.add("${configStoragePath}/${configFileName}")
}

// Docker Based Configurations
def awsRegion = "eu-north-1"
def dockerBuildLevelArguments = [
    ENV_FILE_PATH: "${configStoragePath}/.env"
]

def webImageName = "prod-plane-frontend:latest"
def adminImageName = "prod-plane-adminpanel:latest"
def apiImageName = "prod-plane-apiserver:latest"

// ECS Based Configurations
def clusterName = "logistics-applications-cluster"

// def mainServiceName = "demo-n8n"
// def workerServiceName = "demo-n8n-worker"
// def webhookServiceName = "demo-n8n-webhook"
def apiServiceName = "prod-plane-apiserver"
def celeryServiceName  = "prod-plane-celery"
def cbeatServiceName  = "prod-plane-celery-beat"
def frontEndServiceName  = "prod-plane-frontend"
def adminPanelServiceName  = "prod-plane-admin-panel"

pipeline {
    agent any

    stages {
        // stage ("Send Build started message") {
        //     steps{
        //         sendSlackMessage (
        //             messageType: "start",
        //             slackEnvironment: "demo"
        //         )
        //     }
        // }

        stage ("Generate configs from vault") {
            steps {
                // define vault secret path and env var
                script {
                    def secret = [
                        [
                        path: "${repository}/${projectEnv}", 
                        secretValues: [
                                [envVar: 'CONFIG', vaultKey: 'config.json']
                            ]
                        ]
                    ]
                    // sh "echo ${secret}"
                    withVault(configuration: configuration, vaultSecrets: secret) {
                        sh """
                            set +x
                            echo "Vault CONFIG: \${CONFIG}"   # Debugging, remove in production
                            pwd
                            mkdir -p apiserver/${configStoragePath}
                            echo "\${CONFIG}" > apiserver/${configStoragePath}/.env
                        """

                        // Debugging: Show the contents of the .env file (optional for development only)
                        sh "cat apiserver/${configStoragePath}/.env"

                        // Verify the file has been created
                        sh "ls -l apiserver/${configStoragePath}/.env"
                    }
                }
            }
        }
        stage ("Build docker image") {
            parallel {
                stage ("Build Web Image") {
                    steps {
                        buildDockerImage (
                            awsRegion : awsRegion,
                            imageName : webImageName,
                            directoryPath : ".",
                            dockerfilePath : "web/Dockerfile.web"
                        )
                    }
                }
                stage ("Build Admin Image") {
                    steps {
                        buildDockerImage (
                            awsRegion : awsRegion,
                            imageName : adminImageName,
                            directoryPath : ".",
                            dockerfilePath : "admin/Dockerfile.admin"
                        )
                    }
                }
                stage ("Build API Image") {
                    steps {
                        buildDockerImage (
                            awsRegion : awsRegion,
                            dockerBuildArgs : dockerBuildLevelArguments,
                            imageName : apiImageName,
                            directoryPath : "apiserver",
                            dockerfilePath : "apiserver/Dockerfile.api"
                        )
                    }
                }
            }
        }

        stage("Push to registry") {
            parallel {
                stage ("Push Web Image") {
                    steps {
                        pushDockerImage (
                            awsRegion : awsRegion,
                            imageName : webImageName
                        )
                    }
                }
                stage ("Push Admin Image") {
                    steps {
                        pushDockerImage (
                            awsRegion : awsRegion,
                            imageName : adminImageName
                        )
                    }
                }
                stage ("Push API Image") {
                    steps {
                        pushDockerImage (
                            awsRegion : awsRegion,
                            imageName : apiImageName
                        )
                    }
                }
            }
        }

        stage("Deploy Plane") {
            parallel {
                stage("Deploy Frontend") {
                    steps {
                        script {
                            deployServiceOnECS (
                                awsRegion : awsRegion,
                                imageName : webImageName,
                                ecsClusterName : clusterName,
                                ecsServiceName : frontEndServiceName,
                                timeout : 300
                            )
                        }
                    }
                }

                stage("Deploy Admin") {
                    steps {
                        script {
                            deployServiceOnECS (
                                awsRegion : awsRegion,
                                imageName : adminImageName,
                                ecsClusterName : clusterName,
                                ecsServiceName : adminPanelServiceName,
                                timeout : 300
                            )
                        }
                    }
                }

                stage("Deploy API") {
                    steps {
                        script {
                            deployServiceOnECS (
                                awsRegion : awsRegion,
                                imageName : apiImageName,
                                ecsClusterName : clusterName,
                                ecsServiceName : apiServiceName,
                                timeout : 300
                            )
                        }
                    }
                }
                stage("Deploy Celery") {
                    steps {
                        script {
                            deployServiceOnECS (
                                awsRegion : awsRegion,
                                imageName : apiImageName,
                                ecsClusterName : clusterName,
                                ecsServiceName : celeryServiceName,
                                timeout : 300
                            )
                        }
                    }
                }
                stage("Deploy Beat") {
                    steps {
                        script {
                            deployServiceOnECS (
                                awsRegion : awsRegion,
                                imageName : apiImageName,
                                ecsClusterName : clusterName,
                                ecsServiceName : cbeatServiceName,
                                timeout : 300
                            )
                        }
                    }
                }
            }
        }
    }
    post {
        always {
            sendSlackMessage (
                messageType: "post",
                slackEnvironment: "prod"
            )
        }
    }
}