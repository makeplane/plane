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
	UserId    string `json:"user_id"`
	UserRole  int    `json:"user_role"`
	IsActive  bool   `json:"is_active"`
	UserEmail string `json:"user_email"`
}

type WorkspaceActivationResponse struct {
	WorkspaceID          string            `json:"workspace_id"`
	WorkspaceSlug        string            `json:"workspace_slug"`
	LicenceKey           string            `json:"license"`
	Product              string            `json:"product"`
	ProductType          string            `json:"product_type"`
	MemberList           []WorkspaceMember `json:"license_users"`
	OwnerEmail           string            `json:"owner_email"`
	Seats                int               `json:"purchased_seats"`
	UserCount            int               `json:"user_count"`
	InstanceID           string            `json:"instance_id"`
	Interval             string            `json:"interval"`
	FreeSeats            int               `json:"free_seats"`
	IsOfflinePayment     bool              `json:"is_offline_payment"`
	IsCancelled          bool              `json:"is_cancelled"`
	Subscription         string            `json:"subscription"`
	CurrentPeriodEndDate time.Time         `json:"current_period_end_date"`
	TrialEndDate         time.Time         `json:"trial_end_date"`
	HasAddedPayment      bool              `json:"has_added_payment_method"`
	HasActivatedFree     bool              `json:"has_activated_free_trial"`
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
