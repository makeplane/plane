/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import { useParams } from "react-router";
import { HelpArticleView } from "@/plane-web/components/help-center";

const HelpArticlePage = observer(function HelpArticlePage() {
  const { articleSlug } = useParams();
  return <HelpArticleView articleSlug={articleSlug ?? ""} />;
});

export default HelpArticlePage;
