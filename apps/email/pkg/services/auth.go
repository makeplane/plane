package services

func AuthenticateUser(username, password string) bool {
	return (username == "testuser" && password == "testpass")
}
