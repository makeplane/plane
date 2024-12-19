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
def projectEnv = "demo"

// Config Based configurations
def vaultConfigFilesMap = [
    "ENV" : "env.json",
]
def configStoragePath = "config-files"

// Validation Level Configurations
List<String> configFilesList = []
vaultConfigFilesMap.each { envVariable, configFileName ->
    configFilesList.add("${configStoragePath}/${configFileName}")
}

// Docker Based Configurations
def awsRegion = "us-west-2"
def dockerBuildLevelArguments = [
    CONFIG_FILES_PATH : configStoragePath
]

def frontendImageName = "plane-demo-frontend:latest"
def adminImageName = "plane-demo-admin:latest"
def apiImageName = "plane-demo-api:latest"

// ECS Based Configurations
def clusterName = "demo-applications-fargate"

// def mainServiceName = "demo-n8n"
// def workerServiceName = "demo-n8n-worker"
// def webhookServiceName = "demo-n8n-webhook"
def apiServiceName = "demo-plane-apiserver"
def celeryServiceName  = "demo-plane-celery"
def cbeatServiceName  = "demo-plane-celerybeat"
def frontEndServiceName  = "demo-plane-frontend"
def adminPanelServiceName  = "demo-plane-admin-panel"

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
                        path: "${repository}/${projectEnv}", secretValues: [
                            [envVar: 'CONFIG', vaultKey: 'config.json']
                        ]]
                    ]
                    withVault(configuration: configuration, vaultSecrets: secret) {
                        sh """
                            set +x
                            mkdir -p ${configStoragePath}
                            echo \"\${CONFIG}\" > ${configStoragePath}/config.json
                        """
                    }
                }
            }
        }
        stage ("Build docker image") {
            parallel {
                // stage ("Build Web Image") {
                //     steps {
                //         buildDockerImage (
                //             awsRegion : awsRegion,
                //             dockerBuildArgs : dockerBuildLevelArguments,
                //             imageName : webImageName,
                //             directoryPath : "web",
                //             dockerfilePath : "web/Dockerfile.web"
                //         )
                //     }
                // }
                // stage ("Build Admin Image") {
                //     steps {
                //         buildDockerImage (
                //             awsRegion : awsRegion,
                //             dockerBuildArgs : dockerBuildLevelArguments,
                //             imageName : adminImageName,
                //             directoryPath : "admin",
                //             dockerfilePath : "admin/Dockerfile.admin"
                //         )
                //     }
                // }
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
                // stage ("Push Web Image") {
                //     steps {
                //         pushDockerImage (
                //             awsRegion : awsRegion,
                //             imageName : webImageName
                //         )
                //     }
                // }
                // stage ("Push Admin Image") {
                //     steps {
                //         pushDockerImage (
                //             awsRegion : awsRegion,
                //             imageName : adminImageName
                //         )
                //     }
                // }
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