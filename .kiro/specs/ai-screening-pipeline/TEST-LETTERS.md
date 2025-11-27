# Test Letters for AI Screening Pipeline

Copy and paste these letters to test different AI screening scenarios.

---

## ✅ Letter 1: HIGH QUALITY - Should PASS

**Use this to test:** Passed screening with high scores

```
Dear Fellow Citizens,

In our modern age of rapid technological advancement and global interconnection, we find ourselves at a crossroads that would have fascinated Immanuel Kant. The philosopher who gave us the categorical imperative would surely recognize the moral challenges we face today in the digital realm.

Kant argued that we must act according to principles that could become universal laws. This wisdom becomes particularly relevant when we consider how technology companies handle our personal data. If every corporation treated user privacy as a mere commodity to be exploited, what kind of world would we create? The answer is clear: a world where trust erodes, where human dignity diminishes, and where the very fabric of civil society unravels.

I propose that we, as citizens, demand a new social contract with technology. Just as Kant believed in the inherent dignity of every rational being, we must insist that our digital identities be treated with the same respect. This means transparent data practices, meaningful consent, and accountability when these principles are violated.

The path forward requires both individual responsibility and collective action. We must educate ourselves about digital rights, support legislation that protects privacy, and hold corporations accountable through our choices as consumers. Only by acting on principles that we would will to be universal can we create a digital future worthy of human dignity.

Let us not be passive subjects in this transformation, but active citizens shaping a world where technology serves humanity's highest aspirations.

Sincerely,
A Concerned Citizen
```

**Expected Results:**
- ✅ Passes moderation (no harmful content)
- ✅ High evaluation scores (4.0-5.0 range)
- ✅ Goethe Score > 3.0 (strong Kant connection)
- ✅ Identity not revealed
- ✅ Translations in 5 languages

---

## ✅ Letter 2: MEDIUM QUALITY - Should PASS (Borderline)

**Use this to test:** Passed screening with moderate scores

```
To Whom It May Concern,

I am writing about an important issue that affects us all. In today's world, we face many challenges that require us to think carefully about right and wrong.

Kant taught us about duty and moral law. He said we should treat people as ends in themselves, not just as means to an end. This is important when we think about how governments and companies treat citizens.

For example, when a company collects our data without telling us, they are using us as a means to make money. This goes against Kant's principles. We should demand better treatment.

I believe we need to stand up for our rights. We should ask questions about how our information is used. We should vote for leaders who respect our privacy and dignity.

The future depends on whether we act now or wait. If we wait too long, it might be too late to change things. We must be brave and speak up for what is right.

Thank you for reading my letter.

A Citizen
```

**Expected Results:**
- ✅ Passes moderation
- ⚠️ Moderate evaluation scores (2.5-3.5 range)
- ⚠️ Goethe Score 2.0-2.5 (basic Kant reference)
- ✅ Identity not revealed
- ✅ Translations available
- **Might trigger REVIEW status** due to borderline scores

---

## ❌ Letter 3: LOW QUALITY - Should FAIL (Poor Writing)

**Use this to test:** Failed screening due to low quality scores

```
hey everyone,

so i was thinking about kant and stuff. he was a smart guy who said some things about morals and ethics. i think we should all be good people and do the right thing.

like when companies do bad stuff with our data thats not cool. kant would probably not like that either. we need to fix this problem somehow.

i dont really know what else to say but i think its important. maybe we should all just try to be better people and treat each other nice.

thats all i got.

thanks
```

**Expected Results:**
- ✅ Passes moderation (no harmful content)
- ❌ FAILS evaluation - Low scores:
  - Grammatical Accuracy < 2.0 (informal, errors)
  - Essay Structure < 2.0 (no clear structure)
  - Overall Impression < 2.5 (poor quality)
- ❌ Goethe Score < 2.0 (superficial Kant reference)
- ✅ Identity not revealed
- ✅ Translations still generated
- **Shows Option A/B buttons**

---

## ❌ Letter 4: IDENTITY REVEALED - Should FAIL

**Use this to test:** Failed screening due to identity disclosure

```
Dear Contest Organizers,

My name is John Smith, and I am a professor of philosophy at Harvard University. I have been teaching Kantian ethics for over 20 years, and I feel compelled to share my thoughts on this important matter.

Kant's categorical imperative provides a framework for understanding our moral obligations in the digital age. As someone who has published extensively on this topic (see my book "Digital Ethics in the Kantian Tradition," Oxford University Press, 2023), I believe we must apply these principles rigorously.

The challenge we face is how to translate Kant's 18th-century insights into 21st-century contexts. In my research at Harvard's Center for Digital Ethics, we have found that...

You can reach me at john.smith@harvard.edu or call my office at (617) 555-0123 if you would like to discuss this further.

Best regards,
Professor John Smith
Department of Philosophy
Harvard University
Cambridge, MA 02138
```

**Expected Results:**
- ✅ Passes moderation
- ❌ FAILS evaluation - Identity.Revealed = true
  - Name revealed: "John Smith"
  - Institution: "Harvard University"
  - Email and phone number
  - Specific location
- ⚠️ Other scores might be high (good writing)
- ✅ Translations generated
- **Shows Option A/B buttons**

---

## ❌ Letter 5: HATE SPEECH - Should FAIL (Moderation)

**Use this to test:** Failed moderation (content policy violation)

**⚠️ WARNING: Contains offensive content for testing purposes only**

```
Dear Citizens,

I am writing to express my disgust with certain groups in our society. These people are destroying our country and must be stopped by any means necessary.

[Content intentionally removed - insert hate speech targeting specific groups]

We need to take action against these enemies. Violence may be the only solution to protect our way of life.

A Patriot
```

**Expected Results:**
- ❌ FAILS moderation immediately
- Flagged categories: hate, hate/threatening, violence
- ❌ Pipeline stops - no evaluation or translation
- **Shows Content Policy Violation card**
- **Shows Option A/B buttons**
- No evaluation scores visible
- No translations visible

---

## ❌ Letter 6: VIOLENT CONTENT - Should FAIL (Moderation)

**Use this to test:** Failed moderation (violence category)

**⚠️ WARNING: Contains violent content for testing purposes only**

```
To the Government,

I am tired of waiting for change. The time for peaceful protest is over. We must take up arms and fight back against the corrupt system.

[Content intentionally removed - insert violent threats]

Blood will be spilled if necessary. This is a call to action for all who are willing to fight.

An Angry Citizen
```

**Expected Results:**
- ❌ FAILS moderation immediately
- Flagged categories: violence, violence/graphic
- ❌ Pipeline stops
- **Shows Content Policy Violation card**
- No evaluation or translation data

---

## ⚠️ Letter 7: NON-ENGLISH - Should Trigger REVIEW

**Use this to test:** Manual review due to language detection

```
Sehr geehrte Damen und Herren,

Ich schreibe Ihnen über ein wichtiges Thema, das uns alle betrifft. Immanuel Kant, der große deutsche Philosoph, lehrte uns über die Bedeutung der moralischen Pflicht und des kategorischen Imperativs.

In unserer modernen Welt müssen wir diese Prinzipien auf neue Herausforderungen anwenden. Die digitale Revolution hat Fragen aufgeworfen, die Kant nie hätte vorhersehen können, aber seine philosophischen Grundsätze bleiben relevant.

Wir müssen als Bürger zusammenarbeiten, um eine Gesellschaft zu schaffen, die die Würde jedes Menschen respektiert. Dies erfordert sowohl individuelle Verantwortung als auch kollektives Handeln.

Kant würde uns ermutigen, nach Prinzipien zu handeln, die wir als universelle Gesetze wollen würden. Lassen Sie uns diesen Rat befolgen, während wir die Zukunft gestalten.

Mit freundlichen Grüßen,
Ein besorgter Bürger
```

**Expected Results:**
- ✅ Passes moderation
- ⚠️ Language detected: "German" (not English)
- ⚠️ Status set to REVIEW (manual review needed)
- ✅ Evaluation scores generated
- ✅ Translations generated
- **Shows yellow alert: "Under manual review"**
- No Option A/B buttons (admin will handle)

---

## ✅ Letter 8: EXCELLENT QUALITY - Should PASS with High Scores

**Use this to test:** Passed screening with exceptional scores

```
Dear Fellow Citizens of the World,

We stand at a pivotal moment in human history, one that demands we revisit the foundational principles of moral philosophy articulated by Immanuel Kant. His categorical imperative—that we should act only according to maxims we could will to become universal laws—provides an essential framework for addressing the ethical challenges of our digital age.

Consider the current state of data privacy and algorithmic decision-making. When corporations harvest our personal information without meaningful consent, they treat us as mere means to their commercial ends, violating Kant's fundamental principle of human dignity. If we universalized this practice—if everyone treated everyone else's privacy as expendable—we would create a world incompatible with the very concept of personhood that Kant held sacred.

The solution requires a multi-faceted approach grounded in Kantian ethics. First, we must recognize that privacy is not merely a preference but a prerequisite for autonomous moral agency. Without the ability to control our personal information, we cannot freely deliberate and act according to our own rational will—the very essence of what Kant considered human dignity.

Second, we must demand that technological systems be designed with transparency and accountability. Just as Kant argued that moral laws must be universalizable, the algorithms that increasingly govern our lives must be subject to public scrutiny and democratic oversight. Hidden systems that make consequential decisions about our lives without explanation violate the principle of treating persons as ends in themselves.

Third, we must cultivate what Kant called "enlightenment"—the courage to use our own understanding without guidance from another. In the digital realm, this means developing critical literacy about technology, questioning the systems that shape our information environment, and refusing to surrender our autonomy to opaque corporate or governmental powers.

The path forward is neither simple nor guaranteed, but Kant's philosophy offers us a compass. By insisting on principles that respect human dignity, promote transparency, and enable autonomous moral agency, we can build a digital future worthy of rational beings. This is not merely a technical challenge but a profound moral imperative—one that calls us to act not from inclination or self-interest, but from duty to the universal principles that make civilization possible.

Let us have the courage to think for ourselves, the wisdom to act on principle, and the determination to create institutions that honor the dignity inherent in every human being.

Respectfully submitted,
A Citizen Committed to Enlightenment Ideals
```

**Expected Results:**
- ✅ Passes moderation
- ✅ Excellent evaluation scores (4.5-5.0 range)
  - Grammatical Accuracy: 5.0
  - Essay Structure: 5.0
  - Clarity of Expression: 5.0
  - Argumentation: 5.0
  - Writing Style and Logic: 5.0
  - Overall Impression: 5.0
- ✅ Goethe Score > 4.0 (deep Kant analysis)
- ✅ Identity not revealed
- ✅ Translations in 5 languages
- **Green checkmark: "Passed AI screening"**

---

## ⚠️ Letter 9: BORDERLINE GOETHE SCORE - Might Trigger REVIEW

**Use this to test:** Borderline thematic alignment

```
Dear Community Members,

I want to talk about fairness and justice in our society. These are important values that we should all care about.

When I think about what's right and wrong, I remember learning about a philosopher named Kant. He said something about treating people with respect and not using them. I think this applies to many situations today.

For instance, when companies make decisions that affect our lives, they should consider whether those decisions are fair to everyone. If a rule is good for one person, it should be good for all people. That seems like common sense to me.

We need to work together to make sure everyone is treated fairly. This means speaking up when we see injustice and supporting policies that help everyone, not just a few people.

I hope we can all do our part to make the world a better place.

Thank you,
A Hopeful Citizen
```

**Expected Results:**
- ✅ Passes moderation
- ⚠️ Goethe Score 2.0-2.5 (mentions Kant but superficial)
- ⚠️ Might trigger REVIEW status
- ✅ Moderate evaluation scores (2.5-3.5)
- ✅ Identity not revealed
- ✅ Translations generated
- **Might show yellow alert: "Under manual review"**

---

## ❌ Letter 10: SEXUAL CONTENT - Should FAIL (Moderation)

**Use this to test:** Failed moderation (sexual content)

**⚠️ WARNING: Contains inappropriate content for testing purposes only**

```
Dear Readers,

I want to discuss an important philosophical topic, but first let me share some personal experiences...

[Content intentionally removed - insert sexual content]

Anyway, back to Kant and ethics...
```

**Expected Results:**
- ❌ FAILS moderation immediately
- Flagged categories: sexual
- ❌ Pipeline stops
- **Shows Content Policy Violation card**
- No evaluation or translation

---

## 📋 Quick Reference Guide

| Letter | Scenario | Expected Status | Use Case |
|--------|----------|----------------|----------|
| 1 | High Quality | ✅ PASSED | Test successful screening |
| 2 | Medium Quality | ✅ PASSED / ⚠️ REVIEW | Test borderline pass |
| 3 | Low Quality | ❌ FAILED | Test poor writing quality |
| 4 | Identity Revealed | ❌ FAILED | Test identity detection |
| 5 | Hate Speech | ❌ FAILED | Test moderation (hate) |
| 6 | Violent Content | ❌ FAILED | Test moderation (violence) |
| 7 | Non-English | ⚠️ REVIEW | Test language detection |
| 8 | Excellent Quality | ✅ PASSED | Test high scores |
| 9 | Borderline Kant | ⚠️ REVIEW | Test borderline thematic |
| 10 | Sexual Content | ❌ FAILED | Test moderation (sexual) |

---

## 🎯 Testing Strategy

### For Quick Testing:
1. **Letter 1** - Verify passed screening works
2. **Letter 3** - Verify failed evaluation works
3. **Letter 5** - Verify moderation works

### For Comprehensive Testing:
1. Test all 10 letters in sequence
2. Verify each expected outcome
3. Check all UI states (loading, passed, failed, review)
4. Test Option A/B flows on failed letters

### For Edge Cases:
- **Letter 2** - Borderline pass/review
- **Letter 7** - Non-English language
- **Letter 9** - Borderline Kant score

---

## ⚠️ Important Notes

1. **Moderation Letters (5, 6, 10)**: These contain placeholder text. You may need to add actual offensive content to trigger moderation, or use OpenAI's test cases.

2. **Processing Time**: Each letter takes 30-60 seconds to process through all 3 AI phases.

3. **Cost**: Each letter costs money to process (OpenAI API calls):
   - Moderation: FREE
   - Evaluation: ~$0.01-0.05 per letter
   - Translation: ~$0.02-0.10 per letter

4. **Database**: Make sure you have a valid submission record before testing.

5. **Environment**: Ensure `OPENAI_API_KEY` is set in `.env.local`

---

## 🚀 How to Use These Letters

1. Navigate to your submission form: `/contest/submit`
2. Copy one of the letters above
3. Paste into the letter body field
4. Submit and pay the $7 entry fee
5. Navigate to: `/contest/screening-results/[submissionId]`
6. Watch the loading screen (30-60 seconds)
7. See the results!

---

## 📊 Expected AI Responses

### High Quality Letter (1, 8):
- Rating scores: 4.0-5.0
- Goethe Score: 3.5-5.0
- Summary: Detailed, positive
- Quote: Relevant Kant quote
- Translations: Clean, accurate

### Medium Quality Letter (2, 9):
- Rating scores: 2.5-3.5
- Goethe Score: 2.0-2.5
- Summary: Brief, neutral
- Quote: Generic Kant quote
- Translations: Adequate

### Low Quality Letter (3):
- Rating scores: 1.0-2.0
- Goethe Score: < 2.0
- Summary: Critical
- Quote: May be generic
- Translations: Still generated

### Moderation Failed (5, 6, 10):
- No evaluation scores
- No translations
- Only moderation flag shown

---

**Happy Testing! 🎉**
