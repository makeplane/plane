package db

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type License struct {
	ID                    uuid.UUID  `json:"id" gorm:"primaryKey type:uuid default:gen_random_uuid()"`
	LicenseKey            string     `json:"license_key"`
	InstanceID            uuid.UUID  `json:"instance_id" gorm:"type:uuid"`
	WorkspaceID           uuid.UUID  `json:"workspace_id" gorm:"type:uuid"`
	Product               string     `json:"product"`
	ProductType           string     `json:"product_type"`
	WorkspaceSlug         string     `json:"workspace_slug"`
	Seats                 int        `json:"seats"`
	FreeSeats             int        `json:"free_seats"`
	CurrentPeriodEndDate  *time.Time `json:"current_period_end_date"`
	IsCancelled           bool       `json:"is_cancelled"`
	Interval              string     `json:"interval"`
	IsOfflinePayment      bool       `json:"is_offline_payment"`
	TrialEndDate          *time.Time `json:"trial_end_date"`
	HasAddedPaymentMethod bool       `json:"has_added_payment_method"`
	HasActivatedFreeTrial bool       `json:"has_activated_free_trial"`
	Subscription          string     `json:"subscription"`
	// time stamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (license *License) BeforeCreate(scope *gorm.DB) error {
	license.ID = uuid.New()
	return nil
}

type UserLicense struct {
	ID        uuid.UUID `json:"id" gorm:"primaryKey type:uuid default:gen_random_uuid()"`
	LicenseID uuid.UUID `json:"license_id" gorm:"type:uuid"`
	License   License   `json:"license" gorm:"foreignKey:LicenseID"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid"`
	Role      int       `json:"role"`
	Synced    bool      `json:"synced"`
	IsActive  bool      `json:"is_active"`
	// time stamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (userLicense *UserLicense) BeforeCreate(scope *gorm.DB) error {
	userLicense.ID = uuid.New()
	return nil
}

type Flags struct {
	ID         uuid.UUID `json:"id" gorm:"primaryKey type:uuid default:gen_random_uuid()"`
	LicenseID  uuid.UUID `json:"license_id" gorm:"type:uuid"`
	License    License   `json:"license" gorm:"foreignKey:LicenseID"`
	Version    string    `json:"version"`
	AesKey     string    `json:"aes_key"`
	Nonce      string    `json:"nonce"`
	CipherText string    `json:"cipher_text"`
	Tag        string    `json:"tag"`
	// time stamps
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (flags *Flags) BeforeCreate(scope *gorm.DB) error {
	flags.ID = uuid.New()
	return nil
}
