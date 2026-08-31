import type { InputRule } from "@tiptap/core";
import { Extension } from "@tiptap/core";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
import type { TypographyOptions } from "./inputRules";
import {
  emDash,
  ellipsis,
  leftArrow,
  rightArrow,
  copyright,
  trademark,
  servicemark,
  registeredTrademark,
  oneHalf,
  plusMinus,
  notEqual,
  laquo,
  raquo,
  multiplication,
  superscriptTwo,
  superscriptThree,
  oneQuarter,
  threeQuarters,
  impliesArrowRight,
} from "./inputRules";

export const CustomTypographyExtension = Extension.create<TypographyOptions>({
  name: CORE_EXTENSIONS.TYPOGRAPHY,

  addInputRules() {
    const rules: InputRule[] = [];

    if (this.options.emDash !== false) {
      rules.push(emDash(this.options.emDash));
    }

    if (this.options.impliesArrowRight !== false) {
      rules.push(impliesArrowRight(this.options.impliesArrowRight));
    }

    if (this.options.ellipsis !== false) {
      rules.push(ellipsis(this.options.ellipsis));
    }

    if (this.options.leftArrow !== false) {
      rules.push(leftArrow(this.options.leftArrow));
    }

    if (this.options.rightArrow !== false) {
      rules.push(rightArrow(this.options.rightArrow));
    }

    if (this.options.copyright !== false) {
      rules.push(copyright(this.options.copyright));
    }

    if (this.options.trademark !== false) {
      rules.push(trademark(this.options.trademark));
    }

    if (this.options.servicemark !== false) {
      rules.push(servicemark(this.options.servicemark));
    }

    if (this.options.registeredTrademark !== false) {
      rules.push(registeredTrademark(this.options.registeredTrademark));
    }

    if (this.options.oneHalf !== false) {
      rules.push(oneHalf(this.options.oneHalf));
    }

    if (this.options.plusMinus !== false) {
      rules.push(plusMinus(this.options.plusMinus));
    }

    if (this.options.notEqual !== false) {
      rules.push(notEqual(this.options.notEqual));
    }

    if (this.options.laquo !== false) {
      rules.push(laquo(this.options.laquo));
    }

    if (this.options.raquo !== false) {
      rules.push(raquo(this.options.raquo));
    }

    if (this.options.multiplication !== false) {
      rules.push(multiplication(this.options.multiplication));
    }

    if (this.options.superscriptTwo !== false) {
      rules.push(superscriptTwo(this.options.superscriptTwo));
    }

    if (this.options.superscriptThree !== false) {
      rules.push(superscriptThree(this.options.superscriptThree));
    }

    if (this.options.oneQuarter !== false) {
      rules.push(oneQuarter(this.options.oneQuarter));
    }

    if (this.options.threeQuarters !== false) {
      rules.push(threeQuarters(this.options.threeQuarters));
    }

    return rules;
  },
});
