/*
 * Reading-level checks for the consent summaries. Syllables are estimated by
 * vowel groups, which is the usual approximation and good enough to catch a
 * summary that drifts into legal language. Flesch-Kincaid gives a US grade for
 * English; Fernández-Huerta gives an ease score for Spanish (60+ is "fairly easy").
 */

function words(text: string) {
  return text
    .replace(/[“”"(),:;¿¡]/g, " ")
    .split(/\s+/)
    .map((w) => w.replace(/[.!?]+$/, ""))
    .filter((w) => /\p{L}/u.test(w));
}

function sentences(text: string) {
  return Math.max(1, text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 0).length);
}

function syllablesEn(word: string) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return 1;
  const trimmed = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return Math.max(1, (trimmed.match(/[aeiouy]{1,2}/g) ?? []).length);
}

function syllablesEs(word: string) {
  const w = word.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-zñü]/g, "");
  // Strong-weak vowel pairs (diphthongs) count once; a written accent on the weak vowel would split them, ignored here.
  return Math.max(1, (w.match(/[aeiouü]+/g) ?? []).reduce((n, group) => n + Math.max(1, group.replace(/[iuü](?=[aeo])|(?<=[aeo])[iu]/g, "").length), 0));
}

export function fleschKincaidGrade(text: string) {
  const ws = words(text);
  const syl = ws.reduce((n, w) => n + syllablesEn(w), 0);
  return 0.39 * (ws.length / sentences(text)) + 11.8 * (syl / ws.length) - 15.59;
}

export function fernandezHuerta(text: string) {
  const ws = words(text);
  const syl = ws.reduce((n, w) => n + syllablesEs(w), 0);
  const per100Syl = (syl / ws.length) * 100;
  const sentencesPer100 = (sentences(text) / ws.length) * 100;
  return 206.84 - 0.6 * per100Syl - 1.02 * sentencesPer100;
}
