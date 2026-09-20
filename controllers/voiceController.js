/**
 * Voice Controller — Azure Cognitive Services Speech API proxy
 * Provides TTS (Text-to-Speech) and STT (Speech-to-Text) capabilities
 *
 * NOTE: Requires AZURE_SPEECH_KEY and AZURE_SPEECH_REGION in .env
 * Falls back gracefully to browser-native Web Speech API hint response
 */

/**
 * @desc    Text to Speech — converts text to audio using Azure Speech API
 * @route   POST /api/v1/voice/tts
 * @access  Authenticated
 */
export const textToSpeech = async (req, res, next) => {
  try {
    const { text, voice = 'en-US-JennyNeural', language = 'en-US', rate = '1.0' } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Text is required for TTS.' });
    }

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    // If Azure Speech is configured, proxy the SSML request
    if (speechKey && speechRegion && speechKey !== 'your_azure_speech_key_here') {
      try {
        const ssml = `<speak version='1.0' xml:lang='${language}'>
          <voice name='${voice}'>
            <prosody rate='${rate}'>${text.substring(0, 3000)}</prosody>
          </voice>
        </speak>`;

        const endpoint = `https://${speechRegion}.tts.speech.microsoft.com/cognitiveservices/v1`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': speechKey,
            'Content-Type': 'application/ssml+xml',
            'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3'
          },
          body: ssml
        });

        if (response.ok) {
          const audioBuffer = await response.arrayBuffer();
          const base64Audio = Buffer.from(audioBuffer).toString('base64');

          return res.status(200).json({
            success: true,
            audioBase64: base64Audio,
            format: 'audio/mp3',
            provider: 'azure'
          });
        }
      } catch (azureErr) {
        console.warn('[Voice TTS] Azure Speech failed, falling back:', azureErr.message);
      }
    }

    // Fallback: Return hint for browser-native Web Speech Synthesis
    res.status(200).json({
      success: true,
      audioBase64: null,
      text: text, // Frontend uses this with browser speechSynthesis
      provider: 'browser-native',
      hint: 'Use browser Web Speech API: window.speechSynthesis.speak()'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Speech to Text — converts uploaded audio to text using Azure Speech API
 * @route   POST /api/v1/voice/stt
 * @access  Authenticated
 */
export const speechToText = async (req, res, next) => {
  try {
    const { audioBase64, language = 'en-US' } = req.body;

    const speechKey = process.env.AZURE_SPEECH_KEY;
    const speechRegion = process.env.AZURE_SPEECH_REGION;

    if (speechKey && speechRegion && speechKey !== 'your_azure_speech_key_here' && audioBase64) {
      try {
        const audioBuffer = Buffer.from(audioBase64, 'base64');
        const endpoint = `https://${speechRegion}.stt.speech.microsoft.com/speech/recognition/conversation/cognitiveservices/v1?language=${language}`;

        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Ocp-Apim-Subscription-Key': speechKey,
            'Content-Type': 'audio/wav; codecs=audio/pcm; samplerate=16000'
          },
          body: audioBuffer
        });

        if (response.ok) {
          const data = await response.json();
          return res.status(200).json({
            success: true,
            transcript: data.DisplayText || '',
            confidence: data.NBest?.[0]?.Confidence || 0,
            provider: 'azure'
          });
        }
      } catch (azureErr) {
        console.warn('[Voice STT] Azure Speech failed:', azureErr.message);
      }
    }

    // Fallback: Browser-native recognition
    res.status(200).json({
      success: true,
      transcript: '',
      provider: 'browser-native',
      hint: 'Use browser Web Speech API: new window.SpeechRecognition()'
    });
  } catch (error) {
    next(error);
  }
};
