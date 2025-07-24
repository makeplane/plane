package router

type dummyWriter struct{}

func (w dummyWriter) Write(b []byte) (int, error) {
	return 0, nil
}
