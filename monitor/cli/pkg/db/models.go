package db

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type License struct {
	ID                     uuid.UUID  `json:"id" gorm:"primaryKey;type:uuid"`
	LicenseKey             string     `json:"license_key" gorm:"not null;uniqueIndex:idx_workspace_license"`
	InstanceID             uuid.UUID  `json:"instance_id" gorm:"type:uuid"`
	WorkspaceID            uuid.UUID  `json:"workspace_id" gorm:"type:uuid;not null;unique;uniqueIndex:idx_workspace_license"`
	Product                string     `json:"product" gorm:"not null"`
	ProductType            string     `json:"product_type" gorm:"not null"`
	WorkspaceSlug          string     `json:"workspace_slug" gorm:"not null;unique"`
	Seats                  int        `json:"seats" gorm:"not null;default:0"`
	FreeSeats              int        `json:"free_seats" gorm:"not null;default:12"`
	CurrentPeriodEndDate   *time.Time `json:"current_period_end_date"`
	IsCancelled            bool       `json:"is_cancelled" gorm:"not null;default:false"`
	Interval               string     `json:"interval"`
	IsOfflinePayment       bool       `json:"is_offline_payment" gorm:"not null;default:false"`
	TrialEndDate           *time.Time `json:"trial_end_date"`
	HasAddedPaymentMethod  bool       `json:"has_added_payment_method" gorm:"not null;default:false"`
	HasActivatedFreeTrial  bool       `json:"has_activated_free_trial" gorm:"not null;default:false"`
	Subscription           string     `json:"subscription" gorm:"not null"`
	LastVerifiedAt         *time.Time `json:"last_verified_at"`
	LastPaymentFailedDate  *time.Time `json:"last_payment_failed_date"`
	LastPaymentFailedCount int        `json:"last_payment_failed_count" gorm:"not null;default:0"`
	// time stamps
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (license *License) BeforeCreate(scope *gorm.DB) error {
	license.ID = uuid.New()
	return nil
}

type UserLicense struct {
	ID        uuid.UUID `json:"id" gorm:"primaryKey;type:uuid"`
	LicenseID uuid.UUID `json:"license_id" gorm:"type:uuid;not null"`
	License   License   `json:"license" gorm:"foreignKey:LicenseID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	UserID    uuid.UUID `json:"user_id" gorm:"type:uuid;not null"`
	Role      int       `json:"role" gorm:"not null"`
	Synced    bool      `json:"synced" gorm:"not null;default:false"`
	IsActive  bool      `json:"is_active" gorm:"not null;default:false"`
	// time stamps
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (userLicense *UserLicense) BeforeCreate(scope *gorm.DB) error {
	userLicense.ID = uuid.New()
	return nil
}

type Flags struct {
	ID         uuid.UUID `json:"id" gorm:"primaryKey;type:uuid"`
	LicenseID  uuid.UUID `json:"license_id" gorm:"type:uuid;not null"`
	License    License   `json:"license" gorm:"foreignKey:LicenseID;constraint:OnUpdate:CASCADE,OnDelete:CASCADE"`
	Version    string    `json:"version" gorm:"not null"`
	AesKey     string    `json:"aes_key" gorm:"not null"`
	Nonce      string    `json:"nonce" gorm:"not null"`
	CipherText string    `json:"cipher_text" gorm:"not null"`
	Tag        string    `json:"tag" gorm:"not null"`
	// time stamps
	CreatedAt time.Time `json:"created_at" gorm:"autoCreateTime"`
	UpdatedAt time.Time `json:"updated_at" gorm:"autoUpdateTime"`
}

func (flags *Flags) BeforeCreate(scope *gorm.DB) error {
	flags.ID = uuid.New()
	return nil
}
