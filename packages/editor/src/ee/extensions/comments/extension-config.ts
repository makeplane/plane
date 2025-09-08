import { Mark, mergeAttributes } from "@tiptap/core";
// plane editor imports
import { ADDITIONAL_EXTENSIONS } from "@/plane-editor/constants/extensions";
// local imports
import { commentMarkCommands } from "./commands";
import {
  createClickHandlerPlugin,
  createHoverHandlerPlugin,
  createCommentsOrderPlugin,
  TrackCommentDeletionPlugin,
  TrackCommentRestorationPlugin,
} from "./plugins";
import {
  TCommentMarkOptions,
  TCommentMarkStorage,
  ECommentMarkCSSClasses,
  TCommentMarkAttributes,
  ECommentAttributeNames,
  DEFAULT_COMMENT_ATTRIBUTES,
} from "./types";

export const CommentsExtensionConfig = Mark.create<TCommentMarkOptions, TCommentMarkStorage>({
  name: ADDITIONAL_EXTENSIONS.COMMENTS,
  excludes: "",
  exitable: true,
  inclusive: false,

  addStorage() {
    return {
      commentsOrder: [],
      deletedComments: new Map<string, boolean>(),
    };
  },

  addOptions() {
    return {
      isFlagged: false,
    };
  },

  addAttributes() {
    const attributes = {
      // Reduce instead of map to accumulate the attributes directly into an object
      ...Object.values(ECommentAttributeNames).reduce((acc, value) => {
        acc[value] = {
          default: DEFAULT_COMMENT_ATTRIBUTES[value],
        };
        return acc;
      }, {}),
    };
    return attributes;
  },

  parseHTML() {
    return [
      {
        tag: `span[${ECommentAttributeNames.COMMENT_ID}]`,
        getAttrs: (element: Element) => ({
          commentId: element.getAttribute(ECommentAttributeNames.COMMENT_ID),
          resolved: element.getAttribute(ECommentAttributeNames.RESOLVED) === "true",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    const isResolved = HTMLAttributes[ECommentAttributeNames.RESOLVED] === true;

    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        class: isResolved
          ? `${ECommentMarkCSSClasses.BASE} ${ECommentMarkCSSClasses.RESOLVED}`
          : `${ECommentMarkCSSClasses.BASE} ${ECommentMarkCSSClasses.ACTIVE} relative cursor-pointer transition-all duration-200 ease-out ${ECommentMarkCSSClasses.BACKGROUND} ${ECommentMarkCSSClasses.UNDERLINE}`,
      }),
      0,
    ];
  },

  addProseMirrorPlugins() {
    const { onCommentClick, onCommentDelete, onCommentRestore } = this.options;

    const plugins = [
      // Click handler plugin
      createClickHandlerPlugin({ onCommentClick }),
      // Hover handler plugin
      createHoverHandlerPlugin(),
      // Comments order tracking plugin
      createCommentsOrderPlugin({ storage: this.storage }),
    ];

    // Add comment tracking plugin if handlers provided
    if (onCommentDelete && onCommentRestore) {
      plugins.push(
        TrackCommentRestorationPlugin(this.editor, onCommentRestore),
        TrackCommentDeletionPlugin(this.editor, onCommentDelete)
      );
    }

    return plugins;
  },

  addCommands() {
    return commentMarkCommands(this.type);
  },
});
