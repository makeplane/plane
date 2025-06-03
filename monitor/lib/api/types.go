package prime_api

import "time"

type StatusErrorCode int

const (
	NotReachable StatusErrorCode = iota
	ReachableWithNotOkStatus
)

type StatusMeta struct {
	Message    string          `json:"message"`
	Code       StatusErrorCode `json:"code"`
	StatusCode int             `json:"status_code"`
	Reachable  int             `json:"reachable"`
}

type StatusPayload struct {
	Version string                `json:"version"`
	Status  map[string]string     `json:"status"`
	Meta    map[string]StatusMeta `json:"meta"`
}

type WorkspaceMember struct {
	UserId   string `json:"user_id"`
	UserRole int    `json:"user_role"`
	IsActive bool   `json:"is_active"`
}

type WorkspaceActivationResponse struct {
	WorkspaceID            string                     `json:"workspace_id"`
	WorkspaceSlug          string                     `json:"workspace_slug"`
	LicenceKey             string                     `json:"license"`
	Product                string                     `json:"product"`
	ProductType            string                     `json:"product_type"`
	MemberList             []WorkspaceMember          `json:"license_users"`
	OwnerEmail             string                     `json:"owner_email"`
	Seats                  int                        `json:"purchased_seats"`
	UserCount              int                        `json:"user_count"`
	InstanceID             string                     `json:"instance_id"`
	Interval               string                     `json:"interval"`
	FreeSeats              int                        `json:"free_seats"`
	IsOfflinePayment       bool                       `json:"is_offline_payment"`
	IsCancelled            bool                       `json:"is_cancelled"`
	Subscription           string                     `json:"subscription"`
	CurrentPeriodEndDate   time.Time                  `json:"current_period_end_date"`
	TrialEndDate           time.Time                  `json:"trial_end_date"`
	HasAddedPayment        bool                       `json:"has_added_payment_method"`
	HasActivatedFree       bool                       `json:"has_activated_free_trial"`
	LastPaymentFailedDate  *time.Time                 `json:"last_payment_failed_date"`
	LastPaymentFailedCount int                        `json:"last_payment_failed_count"`
	Flags                  *EncryptedFlagsWithVersion `json:"flags"`
}

type WorkspaceActivationPayload struct {
	WorkspaceSlug string            `json:"workspace_slug"`
	WorkspaceID   string            `json:"workspace_id"`
	MembersList   []WorkspaceMember `json:"members_list"`
	OwnerEmail    string            `json:"owner_email"`
	LicenceKey    string            `json:"license_key"`
}

type WorkspaceSyncPayload struct {
	WorkspaceSlug string            `json:"slug"`
	WorkspaceID   string            `json:"workspace_id"`
	MembersList   []WorkspaceMember `json:"members_list"`
	LicenceKey    string            `json:"license_key"`
}

type GetFlagsPayload struct {
	WorkspaceSlug string `json:"workspace_slug"`
	UserID        string `json:"user_id"`
	FeatureKey    string `json:"feature_key"`
}

type EncyptedFlagData struct {
	AesKey     string `json:"aes_key"`
	Nonce      string `json:"nonce"`
	CipherText string `json:"ciphertext"`
	Tag        string `json:"tag"`
	Version    string `json:"version"`
}

type FlagDataResponse struct {
	WorkspaceID   string           `json:"workspace_id"`
	WorkspaceSlug string           `json:"workspace_slug"`
	LicenceKey    string           `json:"licence"`
	Version       string           `json:"version"`
	EncyptedData  EncyptedFlagData `json:"encrypted_data"`
}

type WorkspaceProductPayload struct {
	FreeSeats     int               `json:"free_seats"`
	WorkspaceSlug string            `json:"workspace_slug"`
	MembersList   []WorkspaceMember `json:"members_list"`
	OwnerEmail    string            `json:"owner_email"`
}

type SeatUpdatePayload struct {
	WorkspaceSlug string `json:"workspace_slug"`
	WorkspaceId   string `json:"workspace_id"`
	Quantity      int64  `json:"quantity"`
	LicenseKey    string `json:"license_key"`
}

type SeatUpdateResponse struct {
	Status bool  `json:"status"`
	Seats  int64 `json:"seats"`
}

type Product struct {
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`
	CreatedByID string                 `json:"created_by_id"`
	UpdatedByID string                 `json:"updated_by_id"`
	ID          string                 `json:"id"`
	Name        string                 `json:"name"`
	Slug        string                 `json:"slug"`
	Description *string                `json:"description"`
	Metadata    map[string]interface{} `json:"metadata"`
	Type        string                 `json:"type"`
	StripeID    string                 `json:"stripe_id"`
	IsActive    bool                   `json:"is_active"`
	Prices      []Price                `json:"prices"`
}

type Price struct {
	ID                string                 `json:"id"`
	ProductID         string                 `json:"product_id"`
	StripePriceID     string                 `json:"stripe_price_id"`
	RecurringInterval string                 `json:"recurring"`
	IsActive          bool                   `json:"is_active"`
	UnitAmount        float64                `json:"unit_amount"`
	Currency          string                 `json:"currency"`
	Metadata          map[string]interface{} `json:"metadata"`
}

type RetrievePaymentLinkPayload struct {
	WorkspaceID     string            `json:"workspace_id"`
	Slug            string            `json:"slug"`
	StripeProductID string            `json:"stripe_product_id"`
	StripePriceID   string            `json:"stripe_price_id"`
	CustomerEmail   string            `json:"customer_email"`
	MembersList     []WorkspaceMember `json:"members_list"`
	RequiredSeats   int               `json:"required_seats"`
}

type RetrievePaymentLinkResponse struct {
	Message     string `json:"message"`
	PaymentLink string `json:"url"`
}
