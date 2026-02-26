import { Normalize } from './normalize';

describe('Normalize.html', () => {
  it('keeps telegram custom emoji tags from directus escaped HTML', () => {
    const input =
      '<p><b>Привет, пиплы!</b></p>\n' +
      '<p><br></p>\n' +
      '<p>Мы сделали мини-приложение &lt;tg-emoji emoji-id="5309832892262654231"&gt;🤖&lt;/tg-emoji&gt;</p>';

    const normalized = Normalize.html(input);

    expect(normalized).toBe(
      '<b>Привет, пиплы!</b>\n\nМы сделали мини-приложение <tg-emoji emoji-id="5309832892262654231">🤖</tg-emoji>',
    );
  });

  it('preserves one and two empty lines between paragraphs', () => {
    const oneEmptyLine = '<p>first</p><p><br></p><p>second</p>';
    const twoEmptyLines =
      '<p>first</p><p><br></p><p><br></p><p>second</p>';

    expect(Normalize.html(oneEmptyLine)).toBe('first\n\nsecond');
    expect(Normalize.html(twoEmptyLines)).toBe('first\n\n\nsecond');
  });

  it('removes unsupported tags but keeps supported telegram tags', () => {
    const input =
      '<p><span style="color:red">text</span> <tg-spoiler>secret</tg-spoiler> <tg-emoji emoji-id="5368324170671202286">👍</tg-emoji></p>';

    expect(Normalize.html(input)).toBe(
      'text <tg-spoiler>secret</tg-spoiler> <tg-emoji emoji-id="5368324170671202286">👍</tg-emoji>',
    );
  });
});
