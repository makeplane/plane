package db

import (
	"gorm.io/driver/sqlite"
	"gorm.io/gorm"
)

var Db *gorm.DB

// Initialize the database
func Initialize() error {
	db, err := gorm.Open(sqlite.Open("monitor.db"), &gorm.Config{})
	if err != nil {
		return err
	}

	// Migrate all the changes to the db
	db.AutoMigrate(&License{}, &UserLicense{}, &Flags{})
	Db = db
	return nil
}
