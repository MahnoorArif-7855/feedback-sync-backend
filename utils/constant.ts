export const ORGANIZATION_STREAM = 'organization_stream';
export const FEEDBACK_STREAM = 'feedback_stream';

export const SLACK = 'slack';
export const G2 = 'g2';
export const ZENDESK = 'zendesk';

export const INTEGRATION = {
  HUBSPOT: 'hubspot',
  JIRA_CONNECTOR: 'connector',
  JIRA: 'jira',
};

export const CATEGORIZE_FEEDBACK_PROMPT = `Please analyze the following user feedback provide me with the output in the following format:

1. A sentiment assessment in the format: "{positive/negative/neutral}".
2. The main topic(s) of the feedback, in the format: "main_topics- {topic or topics}"
3. Which category does this review belongs to. You only have these options {churn/bugs/feature_request/feature_feedback_positive/feature_feedback_negative}: "category- {churn/bugs/feature_request/feature_feedback_positive/feature_feedback_negative}"
4. Write the reason in only 30 words for that category,  It should be presented as: "reason- {reason}"
5. Is there any reason for the user to churn, present as: "churn- {yes/no}"`;

export const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Feedback Sync Welcome</title>
</head>

<body>
    <p>Hello,</p>

    <p>Welcome to Feedback Sync! Our company has one simple premise; to help companies easily collect, analyze, and reference customer feedback.</p>

    <p>While simple in concept, it allows an entire company to become more customer-centric; resulting in better product development, increased differentiation, reduced churn, and more closed deals.</p>

    <p><b>Step 1: Submit and share customer feedback in Slack.</b></p>

    <ol>
        <li><b>Click ‘Write Feedback’:</b> In Slack, navigate to the home screen. On the left side, scroll down to find Apps. Click on Feedback Sync. Then click ‘Write Feedback’.</li>
        
        <img src='https://firebasestorage.googleapis.com/v0/b/feedback-sync.appspot.com/o/ezgif.com-video-to-gif%20(5).gif?alt=media&token=06ea5098-584c-4964-bed8-9a5617681913' />

        <li><b>Or simply write ‘/create-feedback’ in any Slack channel:</b> This will automatically pop-up the ‘Write Feedback’ modal.</li>

        <li><b>Customer feedback comes in many forms:</b> We recommend submitting customer interviews or meeting notes. Or, simply copy and paste customer insights from other tools into Feedback Sync. We offer a CSV bulk upload for customer feedback stored in excel files.</li>
    </ol>

    <p><b>2. Forward any Slack message into your Feedback Sync library.</b></p>
    <img src='https://firebasestorage.googleapis.com/v0/b/feedback-sync.appspot.com/o/ezgif.com-video-to-gif%20(6).gif?alt=media&token=79540f0d-bf2c-4298-babd-1a7abcba2e59' />

    <p><b>3. Share:</b> the app internally and encourage your colleagues to enter customer feedback. Tag specific people or channels who might find certain feedback interesting.</p>

    <p><b>Any feedback submitted through the Slack app will automatically be saved, categorized, and available for AI analysis across the entire organization.</b></p>

    <p><b>Step 2: Analyze with AI or reference historical feedback.</b></p>

    <ol>
        <li>Log into your <a href="https://www.feedbacksync.ai">https://www.feedbacksync.ai</a> account.</li>

        <li>Submit a minimum of 5 pieces of customer feedback to begin training your custom AI. Then ask it any questions that come to mind or let us generate an analysis for you.</li>

        <li>Generative AI can be used to write FAQs, user stories, or anything else you can think of.</li>
        
        <img src='https://firebasestorage.googleapis.com/v0/b/feedback-sync.appspot.com/o/ezgif.com-video-to-gif%20(4).gif?alt=media&token=5a718131-0d0d-4aef-b9ba-6ff7d438f942' />
    </ol>

    <p><b>Step 3: Automate the collection of feedback.</b></p>

    <p>Feedback Sync currently integrates with Zendesk and G2 to automatically ingest customer feedback. If you have other tools you’d like to automatically add to your library, <a href="https://www.feedbacksync.ai/contact-us">please let us know</a>!</p>

    <p>You can reach out to me directly at any time. Customer feedback, as our name and mission imply, is paramount. We hope to hear from you.</p>

    <p>Best, <br> Patrick Philbin (<a href="mailto:patrick@feedbacksync.ai">patrick@feedbacksync.ai</a>)</p>
</body>

</html>

`;
