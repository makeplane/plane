# In-App Tips System Architecture

## Overview

This document outlines the architecture for an event-based in-app tips system that enables pushing tips, upgrade prompts, and announcements to users with persistent dismissal tracking.

**Key Principle**: Everything is an event. When a user dismisses a tip, that event is recorded and the tip never appears again for that user.

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            PAYLOAD CMS                                       │
│                     (Content Management Layer)                               │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Tips           │  │  Upgrade        │  │  Announcements  │              │
│  │  Collection     │  │  Prompts        │  │  Collection     │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
│  - Content editing by marketing/product team                                 │
│  - Scheduling (start_date, end_date)                                        │
│  - Targeting rules (user segments, plans, features)                         │
│  - Rich content (images, CTAs, links)                                       │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ Webhook / API Sync
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DJANGO API SERVER                                   │
│                      (Business Logic Layer)                                  │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    TipRegistry                                       │    │
│  │  - Synced from Payload CMS                                          │    │
│  │  - Cached in Redis for fast lookups                                 │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    TipDismissal                                      │    │
│  │  - User dismissal events (PostgreSQL)                               │    │
│  │  - Permanent record per user + tip                                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    Visibility Engine                                 │    │
│  │  - Filters tips based on:                                           │    │
│  │    • User's dismissed tips                                          │    │
│  │    • Targeting rules (plan, features, segment)                      │    │
│  │    • Date constraints (start/end)                                   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└──────────────────────────────────┬──────────────────────────────────────────┘
                                   │
                                   │ REST API
                                   ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                          FRONTEND (React)                                    │
│                       (Presentation Layer)                                   │
│                                                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐              │
│  │  Modal          │  │  Banner         │  │  Tooltip        │              │
│  │  Tips           │  │  Tips           │  │  Tips           │              │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘              │
│                                                                              │
│  - Fetch active tips on app load                                            │
│  - Render based on tip type                                                 │
│  - Send dismissal events                                                    │
│  - Track interactions via PostHog                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### 1. Content Creation Flow

```
Product/Marketing Team
        │
        ▼
┌─────────────────┐
│   Payload CMS   │
│   Admin UI      │
└────────┬────────┘
         │
         │ Creates/Updates tip
         ▼
┌─────────────────┐
│  Payload fires  │
│  webhook        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Django API     │
│  syncs to Redis │
└─────────────────┘
```

### 2. User Tips Flow

```
User loads app
        │
        ▼
┌─────────────────┐
│ GET /api/v1/    │
│ tips/active/    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────────┐
│           Django API Server             │
│                                         │
│  1. Fetch all tips from Redis           │
│  2. Get user's dismissal records        │
│  3. Apply targeting rules               │
│  4. Filter out dismissed tips           │
│  5. Return visible tips                 │
└────────┬────────────────────────────────┘
         │
         ▼
┌─────────────────┐
│  Frontend       │
│  renders        │
│  tips           │
└─────────────────┘
```

### 3. Dismissal Flow

```
User clicks dismiss
        │
        ▼
┌─────────────────────────────────────────┐
│  POST /api/v1/tips/{id}/dismiss/        │
└────────┬────────────────────────────────┘
         │
         ├──────────────────────────────────┐
         ▼                                  ▼
┌─────────────────┐              ┌─────────────────┐
│  Django API     │              │  PostHog        │
│  saves          │              │  event tracked  │
│  dismissal      │              │                 │
└─────────────────┘              └─────────────────┘
```

---

## Payload CMS Schema

### Tips Collection

```typescript
// payload.config.ts
import { CollectionConfig } from "payload/types";

export const InAppTips: CollectionConfig = {
  slug: "in-app-tips",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "type", "status", "startsAt", "expiresAt"],
  },
  hooks: {
    afterChange: [syncToPlaneAPI], // Webhook to Django
  },
  fields: [
    {
      name: "tipId",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Unique identifier used for tracking dismissals",
      },
    },
    {
      name: "title",
      type: "text",
      required: true,
    },
    {
      name: "type",
      type: "select",
      required: true,
      options: [
        { label: "Tip", value: "tip" },
        { label: "Upgrade Prompt", value: "upgrade" },
        { label: "Announcement", value: "announcement" },
        { label: "Feature Highlight", value: "feature" },
        { label: "Warning", value: "warning" },
      ],
    },
    {
      name: "displayType",
      type: "select",
      required: true,
      options: [
        { label: "Modal", value: "modal" },
        { label: "Banner", value: "banner" },
        { label: "Toast", value: "toast" },
        { label: "Tooltip", value: "tooltip" },
        { label: "Inline", value: "inline" },
      ],
    },
    {
      name: "content",
      type: "group",
      fields: [
        {
          name: "heading",
          type: "text",
        },
        {
          name: "body",
          type: "richText",
        },
        {
          name: "image",
          type: "upload",
          relationTo: "media",
        },
        {
          name: "primaryCTA",
          type: "group",
          fields: [
            { name: "label", type: "text" },
            { name: "url", type: "text" },
            { name: "action", type: "select", options: ["link", "upgrade", "dismiss"] },
          ],
        },
        {
          name: "secondaryCTA",
          type: "group",
          fields: [
            { name: "label", type: "text" },
            { name: "url", type: "text" },
            { name: "action", type: "select", options: ["link", "dismiss"] },
          ],
        },
      ],
    },
    {
      name: "targeting",
      type: "group",
      fields: [
        {
          name: "plans",
          type: "select",
          hasMany: true,
          options: [
            { label: "Free", value: "free" },
            { label: "Pro", value: "pro" },
            { label: "Business", value: "business" },
            { label: "Enterprise", value: "enterprise" },
          ],
          admin: {
            description: "Leave empty to target all plans",
          },
        },
        {
          name: "userSegments",
          type: "select",
          hasMany: true,
          options: [
            { label: "New Users (< 7 days)", value: "new" },
            { label: "Active Users", value: "active" },
            { label: "Dormant Users", value: "dormant" },
            { label: "Power Users", value: "power" },
            { label: "Admins Only", value: "admin" },
          ],
        },
        {
          name: "features",
          type: "select",
          hasMany: true,
          admin: {
            description: "Show only to users who have/haven't used specific features",
          },
          options: [
            { label: "Has used Cycles", value: "has_cycles" },
            { label: "Has used Modules", value: "has_modules" },
            { label: "Never used AI", value: "no_ai" },
            { label: "Has integrations", value: "has_integrations" },
          ],
        },
        {
          name: "pages",
          type: "select",
          hasMany: true,
          admin: {
            description: "Show only on specific pages",
          },
          options: [
            { label: "Dashboard", value: "dashboard" },
            { label: "Issues List", value: "issues" },
            { label: "Cycles", value: "cycles" },
            { label: "Modules", value: "modules" },
            { label: "Settings", value: "settings" },
            { label: "All Pages", value: "all" },
          ],
        },
      ],
    },
    {
      name: "scheduling",
      type: "group",
      fields: [
        {
          name: "startsAt",
          type: "date",
          required: true,
          admin: {
            date: {
              pickerAppearance: "dayAndTime",
            },
          },
        },
        {
          name: "expiresAt",
          type: "date",
          admin: {
            date: {
              pickerAppearance: "dayAndTime",
            },
            description: "Leave empty for no expiration",
          },
        },
      ],
    },
    {
      name: "priority",
      type: "number",
      defaultValue: 0,
      admin: {
        description: "Higher priority tips shown first (0-100)",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "draft",
      options: [
        { label: "Draft", value: "draft" },
        { label: "Active", value: "active" },
        { label: "Paused", value: "paused" },
        { label: "Archived", value: "archived" },
      ],
    },
    {
      name: "metadata",
      type: "json",
      admin: {
        description: "Additional data for analytics or custom rendering",
      },
    },
  ],
};

// Webhook hook to sync to Django
async function syncToPlaneAPI({ doc, operation }) {
  const webhookUrl = process.env.PLANE_API_WEBHOOK_URL;

  await fetch(`${webhookUrl}/api/v1/webhooks/tips/sync/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Webhook-Secret": process.env.WEBHOOK_SECRET,
    },
    body: JSON.stringify({
      operation, // 'create' | 'update' | 'delete'
      tip: doc,
    }),
  });
}
```

---

## Django API Server Implementation

### Models

```python
# plane/app/models/tip.py

from django.db import models
from django.conf import settings
import uuid


class TipRegistry(models.Model):
    """
    Synced from Payload CMS. Cached in Redis for fast lookups.
    This is the source of truth for what tips exist.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    # Synced from Payload CMS
    payload_id = models.CharField(max_length=255, unique=True)
    tip_id = models.CharField(max_length=255, unique=True, db_index=True)

    # Denormalized for filtering without CMS lookup
    tip_type = models.CharField(max_length=50)
    display_type = models.CharField(max_length=50)
    status = models.CharField(max_length=20, default='active')
    priority = models.IntegerField(default=0)

    # Targeting (stored as JSON for flexibility)
    targeting = models.JSONField(default=dict)

    # Scheduling
    starts_at = models.DateTimeField()
    expires_at = models.DateTimeField(null=True, blank=True)

    # Full content from Payload (rendered by frontend)
    content = models.JSONField(default=dict)

    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    synced_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'tip_registry'
        ordering = ['-priority', '-created_at']

    def __str__(self):
        return f"{self.tip_id} ({self.tip_type})"


class TipDismissal(models.Model):
    """
    Records when a user dismisses a tip.
    This is an append-only event log.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tip_dismissals'
    )
    tip_id = models.CharField(max_length=255, db_index=True)

    # Event metadata
    dismissed_at = models.DateTimeField(auto_now_add=True)
    dismiss_action = models.CharField(
        max_length=20,
        default='dismiss',
        choices=[
            ('dismiss', 'Dismissed'),
            ('cta_click', 'CTA Clicked'),
            ('auto_expire', 'Auto Expired'),
        ]
    )

    # Optional: store context for analytics
    context = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = 'tip_dismissals'
        unique_together = ['user', 'tip_id']
        indexes = [
            models.Index(fields=['user', 'tip_id']),
            models.Index(fields=['dismissed_at']),
        ]

    def __str__(self):
        return f"{self.user_id} dismissed {self.tip_id}"
```

### Serializers

```python
# plane/api/serializers/tip.py

from rest_framework import serializers
from plane.app.models import TipRegistry, TipDismissal


class TipContentSerializer(serializers.Serializer):
    heading = serializers.CharField(allow_null=True)
    body = serializers.CharField(allow_null=True)
    image = serializers.URLField(allow_null=True)
    primaryCTA = serializers.DictField(allow_null=True)
    secondaryCTA = serializers.DictField(allow_null=True)


class ActiveTipSerializer(serializers.ModelSerializer):
    content = TipContentSerializer()

    class Meta:
        model = TipRegistry
        fields = [
            'tip_id',
            'tip_type',
            'display_type',
            'priority',
            'content',
        ]


class TipDismissSerializer(serializers.Serializer):
    tip_id = serializers.CharField(required=True)
    dismiss_action = serializers.ChoiceField(
        choices=['dismiss', 'cta_click'],
        default='dismiss'
    )
    context = serializers.DictField(required=False, default=dict)
```

### Views

```python
# plane/api/views/tip.py

from datetime import datetime
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.core.cache import cache
from django.utils import timezone

from plane.app.models import TipRegistry, TipDismissal
from plane.api.serializers.tip import (
    ActiveTipSerializer,
    TipDismissSerializer,
)


class ActiveTipsView(APIView):
    """
    GET /api/v1/tips/active/

    Returns all active tips for the current user,
    excluding those they have dismissed.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        current_page = request.query_params.get('page', 'all')

        # Get user's dismissed tip IDs
        dismissed_ids = set(
            TipDismissal.objects.filter(
                user=user
            ).values_list('tip_id', flat=True)
        )

        # Get all active tips (from cache or DB)
        tips = self._get_active_tips()

        # Filter out dismissed and apply targeting
        visible_tips = []
        for tip in tips:
            # Skip if dismissed
            if tip.tip_id in dismissed_ids:
                continue

            # Apply targeting rules
            if not self._matches_targeting(tip, user, current_page):
                continue

            visible_tips.append(tip)

        serializer = ActiveTipSerializer(visible_tips, many=True)
        return Response(serializer.data)

    def _get_active_tips(self):
        """Get active tips from cache or database."""
        cache_key = 'active_tips'
        tips = cache.get(cache_key)

        if tips is None:
            now = timezone.now()
            tips = list(
                TipRegistry.objects.filter(
                    status='active',
                    starts_at__lte=now,
                ).exclude(
                    expires_at__lt=now
                ).order_by('-priority', '-created_at')
            )
            cache.set(cache_key, tips, timeout=60)  # 1 minute cache

        return tips

    def _matches_targeting(self, tip, user, current_page):
        """Check if tip targeting rules match the user."""
        targeting = tip.targeting or {}

        # Check plan targeting
        plans = targeting.get('plans', [])
        if plans and hasattr(user, 'current_plan'):
            if user.current_plan not in plans:
                return False

        # Check page targeting
        pages = targeting.get('pages', [])
        if pages and 'all' not in pages:
            if current_page not in pages:
                return False

        # Check user segments
        segments = targeting.get('userSegments', [])
        if segments:
            user_segment = self._get_user_segment(user)
            if user_segment not in segments:
                return False

        # Check feature targeting
        features = targeting.get('features', [])
        if features:
            if not self._matches_feature_targeting(user, features):
                return False

        return True

    def _get_user_segment(self, user):
        """Determine user's segment based on behavior."""
        days_since_signup = (timezone.now() - user.created_at).days

        if days_since_signup < 7:
            return 'new'
        # Add more segment logic based on your needs
        return 'active'

    def _matches_feature_targeting(self, user, features):
        """Check if user matches feature-based targeting."""
        # Implement based on your feature tracking
        return True


class DismissTipView(APIView):
    """
    POST /api/v1/tips/<tip_id>/dismiss/

    Records a dismissal event for the tip.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, tip_id):
        serializer = TipDismissSerializer(data={
            'tip_id': tip_id,
            **request.data
        })
        serializer.is_valid(raise_exception=True)

        # Create dismissal record (idempotent via unique constraint)
        dismissal, created = TipDismissal.objects.get_or_create(
            user=request.user,
            tip_id=tip_id,
            defaults={
                'dismiss_action': serializer.validated_data.get('dismiss_action', 'dismiss'),
                'context': serializer.validated_data.get('context', {}),
            }
        )

        return Response(
            {'dismissed': True, 'created': created},
            status=status.HTTP_200_OK
        )


class TipWebhookView(APIView):
    """
    POST /api/v1/webhooks/tips/sync/

    Receives webhooks from Payload CMS when tips are
    created, updated, or deleted.
    """
    permission_classes = []  # Authenticated via webhook secret

    def post(self, request):
        # Verify webhook secret
        secret = request.headers.get('X-Webhook-Secret')
        if secret != settings.TIP_WEBHOOK_SECRET:
            return Response(status=status.HTTP_401_UNAUTHORIZED)

        operation = request.data.get('operation')
        tip_data = request.data.get('tip')

        if operation == 'delete':
            TipRegistry.objects.filter(
                payload_id=tip_data.get('id')
            ).delete()
        else:
            TipRegistry.objects.update_or_create(
                payload_id=tip_data.get('id'),
                defaults={
                    'tip_id': tip_data.get('tipId'),
                    'tip_type': tip_data.get('type'),
                    'display_type': tip_data.get('displayType'),
                    'status': tip_data.get('status'),
                    'priority': tip_data.get('priority', 0),
                    'targeting': tip_data.get('targeting', {}),
                    'starts_at': tip_data.get('scheduling', {}).get('startsAt'),
                    'expires_at': tip_data.get('scheduling', {}).get('expiresAt'),
                    'content': tip_data.get('content', {}),
                }
            )

        # Invalidate cache
        cache.delete('active_tips')

        return Response({'synced': True})
```

### URLs

```python
# plane/api/urls/tip.py

from django.urls import path
from plane.api.views.tip import (
    ActiveTipsView,
    DismissTipView,
    TipWebhookView,
)

urlpatterns = [
    path(
        'tips/active/',
        ActiveTipsView.as_view(),
        name='active-tips'
    ),
    path(
        'tips/<str:tip_id>/dismiss/',
        DismissTipView.as_view(),
        name='dismiss-tip'
    ),
    path(
        'webhooks/tips/sync/',
        TipWebhookView.as_view(),
        name='tip-webhook'
    ),
]
```

---

## Frontend Implementation

### Types

```typescript
// packages/types/src/tip.d.ts

export interface InAppTip {
  tip_id: string;
  tip_type: "tip" | "upgrade" | "announcement" | "feature" | "warning";
  display_type: "modal" | "banner" | "toast" | "tooltip" | "inline";
  priority: number;
  content: {
    heading?: string;
    body?: string;
    image?: string;
    primaryCTA?: {
      label: string;
      url?: string;
      action: "link" | "upgrade" | "dismiss";
    };
    secondaryCTA?: {
      label: string;
      url?: string;
      action: "link" | "dismiss";
    };
  };
}
```

### Service

```typescript
// packages/services/src/tip.service.ts

import { API_BASE_URL } from "@plane/constants";
import { InAppTip } from "@plane/types";
import { APIService } from "./api.service";

export class TipService extends APIService {
  constructor() {
    super(API_BASE_URL);
  }

  async getActiveTips(page?: string): Promise<InAppTip[]> {
    const params = page ? `?page=${page}` : "";
    return this.get(`/api/v1/tips/active/${params}`)
      .then((response) => response.data)
      .catch((error) => {
        console.error("Error fetching tips:", error);
        return [];
      });
  }

  async dismissTip(
    tipId: string,
    action: "dismiss" | "cta_click" = "dismiss",
    context?: Record<string, any>
  ): Promise<void> {
    return this.post(`/api/v1/tips/${tipId}/dismiss/`, {
      dismiss_action: action,
      context,
    });
  }
}

export const tipService = new TipService();
```

### MobX Store

```typescript
// packages/shared-state/src/stores/tip.store.ts

import { action, makeObservable, observable, runInAction } from "mobx";
import { InAppTip } from "@plane/types";
import { tipService } from "@plane/services";
import posthog from "posthog-js";

export class InAppTipStore {
  // Observables
  tips: InAppTip[] = [];
  isLoading: boolean = false;
  dismissedIds: Set<string> = new Set();

  constructor() {
    makeObservable(this, {
      tips: observable,
      isLoading: observable,
      dismissedIds: observable,
      fetchTips: action,
      dismissTip: action,
    });
  }

  /**
   * Fetch active tips for the current page
   */
  fetchTips = async (currentPage?: string) => {
    this.isLoading = true;

    try {
      const tips = await tipService.getActiveTips(currentPage);

      runInAction(() => {
        this.tips = tips.filter((t) => !this.dismissedIds.has(t.tip_id));
        this.isLoading = false;
      });
    } catch (error) {
      runInAction(() => {
        this.isLoading = false;
      });
    }
  };

  /**
   * Dismiss a tip and track the event
   */
  dismissTip = async (tipId: string, action: "dismiss" | "cta_click" = "dismiss") => {
    // Optimistically remove from UI
    runInAction(() => {
      this.dismissedIds.add(tipId);
      this.tips = this.tips.filter((t) => t.tip_id !== tipId);
    });

    // Find tip for tracking
    const tip = this.tips.find((t) => t.tip_id === tipId);

    // Track in PostHog
    posthog.capture("tip_dismissed", {
      tip_id: tipId,
      tip_type: tip?.tip_type,
      display_type: tip?.display_type,
      dismiss_action: action,
    });

    // Persist dismissal
    try {
      await tipService.dismissTip(tipId, action);
    } catch (error) {
      console.error("Failed to persist tip dismissal:", error);
      // Don't rollback - user experience is more important
    }
  };

  /**
   * Get tips by display type
   */
  getByDisplayType = (displayType: InAppTip["display_type"]) => {
    return this.tips.filter((t) => t.display_type === displayType);
  };

  /**
   * Get the highest priority tip of a specific type
   */
  getTopTip = (displayType: InAppTip["display_type"]) => {
    const tips = this.getByDisplayType(displayType);
    return tips.length > 0 ? tips[0] : null;
  };
}
```

### React Components

```typescript
// apps/web/components/tips/tip-provider.tsx

import { FC, useEffect, createContext, useContext, ReactNode } from "react";
import { observer } from "mobx-react-lite";
import { useLocation } from "react-router-dom";
import { useStore } from "@plane/shared-state";
import { TipModal } from "./tip-modal";
import { TipBanner } from "./tip-banner";
import { TipToast } from "./tip-toast";

interface TipContextType {
  dismissTip: (id: string, action?: "dismiss" | "cta_click") => void;
}

const TipContext = createContext<TipContextType | null>(null);

export const useTips = () => {
  const context = useContext(TipContext);
  if (!context) {
    throw new Error("useTips must be used within TipProvider");
  }
  return context;
};

interface Props {
  children: ReactNode;
}

export const TipProvider: FC<Props> = observer(({ children }) => {
  const location = useLocation();
  const { inAppTip: store } = useStore();

  // Fetch tips on mount and route change
  useEffect(() => {
    const currentPage = location.pathname.split("/")[1] || "dashboard";
    store.fetchTips(currentPage);
  }, [location.pathname]);

  const dismissTip = (id: string, action: "dismiss" | "cta_click" = "dismiss") => {
    store.dismissTip(id, action);
  };

  const modalTip = store.getTopTip("modal");
  const bannerTip = store.getTopTip("banner");
  const toastTips = store.getByDisplayType("toast");

  return (
    <TipContext.Provider value={{ dismissTip }}>
      {children}

      {/* Render tips based on display type */}
      {modalTip && <TipModal tip={modalTip} onDismiss={dismissTip} />}

      {bannerTip && <TipBanner tip={bannerTip} onDismiss={dismissTip} />}

      {toastTips.map((tip) => (
        <TipToast key={tip.tip_id} tip={tip} onDismiss={dismissTip} />
      ))}
    </TipContext.Provider>
  );
});
```

```typescript
// apps/web/components/tips/tip-modal.tsx

import { FC } from "react";
import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { InAppTip } from "@plane/types";
import { Button } from "@plane/ui";

interface Props {
  tip: InAppTip;
  onDismiss: (id: string, action?: "dismiss" | "cta_click") => void;
}

export const TipModal: FC<Props> = observer(({ tip, onDismiss }) => {
  const { content, tip_id } = tip;

  const handlePrimaryAction = () => {
    if (content.primaryCTA?.action === "link" && content.primaryCTA.url) {
      window.open(content.primaryCTA.url, "_blank");
    }
    onDismiss(tip_id, "cta_click");
  };

  const handleSecondaryAction = () => {
    if (content.secondaryCTA?.action === "link" && content.secondaryCTA.url) {
      window.open(content.secondaryCTA.url, "_blank");
    }
    onDismiss(tip_id, "dismiss");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="relative w-full max-w-md rounded-lg bg-custom-background-100 p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={() => onDismiss(tip_id)}
          className="absolute right-4 top-4 text-custom-text-300 hover:text-custom-text-100"
        >
          <X size={20} />
        </button>

        {/* Image */}
        {content.image && <img src={content.image} alt="" className="mb-4 h-40 w-full rounded-md object-cover" />}

        {/* Content */}
        <h3 className="mb-2 text-lg font-semibold text-custom-text-100">{content.heading}</h3>

        {content.body && (
          <div className="mb-6 text-sm text-custom-text-200" dangerouslySetInnerHTML={{ __html: content.body }} />
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {content.primaryCTA && (
            <Button onClick={handlePrimaryAction} variant="primary">
              {content.primaryCTA.label}
            </Button>
          )}
          {content.secondaryCTA && (
            <Button onClick={handleSecondaryAction} variant="neutral-primary">
              {content.secondaryCTA.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
});
```

```typescript
// apps/web/components/tips/tip-banner.tsx

import { FC } from "react";
import { X } from "lucide-react";
import { observer } from "mobx-react-lite";
import { InAppTip } from "@plane/types";

interface Props {
  tip: InAppTip;
  onDismiss: (id: string, action?: "dismiss" | "cta_click") => void;
}

export const TipBanner: FC<Props> = observer(({ tip, onDismiss }) => {
  const { content, tip_id, tip_type } = tip;

  const bgColor =
    {
      tip: "bg-blue-500/10 border-blue-500/20",
      upgrade: "bg-amber-500/10 border-amber-500/20",
      announcement: "bg-green-500/10 border-green-500/20",
      feature: "bg-purple-500/10 border-purple-500/20",
      warning: "bg-red-500/10 border-red-500/20",
    }[tip_type] || "bg-custom-primary/10";

  return (
    <div className={`fixed left-0 right-0 top-0 z-40 border-b px-4 py-3 ${bgColor}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-custom-text-100">{content.heading}</span>
          {content.primaryCTA && (
            <a
              href={content.primaryCTA.url}
              onClick={() => onDismiss(tip_id, "cta_click")}
              className="text-sm font-medium text-custom-primary-100 hover:underline"
            >
              {content.primaryCTA.label} →
            </a>
          )}
        </div>
        <button onClick={() => onDismiss(tip_id)} className="text-custom-text-300 hover:text-custom-text-100">
          <X size={18} />
        </button>
      </div>
    </div>
  );
});
```

---

## PostHog Integration

### Event Schema

```typescript
// Track these events for analytics

// When tip is shown
posthog.capture('tip_shown', {
  tip_id: string,
  tip_type: 'tip' | 'upgrade' | 'announcement' | 'feature' | 'warning',
  display_type: 'modal' | 'banner' | 'toast' | 'tooltip' | 'inline',
  page: string,
});

// When tip is dismissed
posthog.capture('tip_dismissed', {
  tip_id: string,
  tip_type: string,
  display_type: string,
  dismiss_action: 'dismiss' | 'cta_click',
  time_visible_seconds: number,  // How long before dismissal
});

// When CTA is clicked
posthog.capture('tip_cta_clicked', {
  tip_id: string,
  cta_type: 'primary' | 'secondary',
  cta_action: 'link' | 'upgrade' | 'dismiss',
  cta_url?: string,
});
```

### PostHog Dashboard Recommendations

Create these dashboards:

1. **Tip Performance**
   - Impressions per tip
   - Dismiss rate by tip type
   - CTA click-through rate
   - Average time to dismissal

2. **Conversion Tracking**
   - Upgrade prompt → Actual upgrades
   - Feature highlight → Feature adoption
   - Tip shown → Task completion

3. **User Segments**
   - Which segments see most tips
   - Which segments dismiss fastest
   - Which segments convert best

---

## Database Migrations

```python
# plane/app/migrations/XXXX_add_tip_models.py

from django.db import migrations, models
import django.db.models.deletion
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('app', 'previous_migration'),
    ]

    operations = [
        migrations.CreateModel(
            name='TipRegistry',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('payload_id', models.CharField(max_length=255, unique=True)),
                ('tip_id', models.CharField(db_index=True, max_length=255, unique=True)),
                ('tip_type', models.CharField(max_length=50)),
                ('display_type', models.CharField(max_length=50)),
                ('status', models.CharField(default='active', max_length=20)),
                ('priority', models.IntegerField(default=0)),
                ('targeting', models.JSONField(default=dict)),
                ('starts_at', models.DateTimeField()),
                ('expires_at', models.DateTimeField(blank=True, null=True)),
                ('content', models.JSONField(default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('synced_at', models.DateTimeField(auto_now=True)),
            ],
            options={
                'db_table': 'tip_registry',
                'ordering': ['-priority', '-created_at'],
            },
        ),
        migrations.CreateModel(
            name='TipDismissal',
            fields=[
                ('id', models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True)),
                ('tip_id', models.CharField(db_index=True, max_length=255)),
                ('dismissed_at', models.DateTimeField(auto_now_add=True)),
                ('dismiss_action', models.CharField(
                    choices=[
                        ('dismiss', 'Dismissed'),
                        ('cta_click', 'CTA Clicked'),
                        ('auto_expire', 'Auto Expired'),
                    ],
                    default='dismiss',
                    max_length=20,
                )),
                ('context', models.JSONField(blank=True, default=dict)),
                ('user', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='tip_dismissals',
                    to='app.user',
                )),
            ],
            options={
                'db_table': 'tip_dismissals',
                'unique_together': {('user', 'tip_id')},
            },
        ),
        migrations.AddIndex(
            model_name='tipdismissal',
            index=models.Index(fields=['user', 'tip_id'], name='tip_user_tip_idx'),
        ),
        migrations.AddIndex(
            model_name='tipdismissal',
            index=models.Index(fields=['dismissed_at'], name='tip_dismissed_at_idx'),
        ),
    ]
```

---

## Configuration

### Environment Variables

```bash
# Django API
TIP_WEBHOOK_SECRET=your-webhook-secret
PAYLOAD_CMS_URL=https://your-payload-cms.com

# Payload CMS
PLANE_API_WEBHOOK_URL=https://api.plane.so
WEBHOOK_SECRET=your-webhook-secret
```

### Settings

```python
# plane/settings/common.py

TIP_WEBHOOK_SECRET = os.environ.get('TIP_WEBHOOK_SECRET', '')

# Cache settings for tips
CACHES = {
    'default': {
        # ... existing config
    },
    'tips': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': os.environ.get('REDIS_URL'),
        'TIMEOUT': 60,  # 1 minute default
    },
}
```

---

## Implementation Checklist

### Phase 1: Backend Foundation

- [ ] Create Django models and migrations
- [ ] Implement API endpoints
- [ ] Set up webhook receiver from Payload CMS
- [ ] Add Redis caching for tips
- [ ] Write unit tests

### Phase 2: Payload CMS Setup

- [ ] Create InAppTips collection
- [ ] Configure webhook to Django
- [ ] Set up admin UI for content team
- [ ] Create initial test tips

### Phase 3: Frontend Implementation

- [ ] Add TypeScript types
- [ ] Create tip service
- [ ] Implement MobX store
- [ ] Build tip components (Modal, Banner, Toast)
- [ ] Create TipProvider wrapper
- [ ] Integrate PostHog tracking

### Phase 4: Testing & Launch

- [ ] End-to-end testing
- [ ] A/B test tip variants
- [ ] Monitor dismissal rates
- [ ] Iterate on targeting rules

---

## Future Enhancements

1. **Frequency Capping**: Limit how many tips a user sees per day/session
2. **Tip Sequences**: Multi-step onboarding flows
3. **Smart Timing**: Show tips at optimal times based on user behavior
4. **Personalization**: ML-based targeting based on user patterns
5. **Localization**: Multi-language support via Payload CMS
6. **A/B Testing**: Built-in variant testing with PostHog feature flags
