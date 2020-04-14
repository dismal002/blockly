/**
 * @license
 * Copyright 2019 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

suite('Utils', function() {
  test('genUid', function() {
    var uuids = {};
    chai.assert.equal([1,2,3].indexOf(4), -1);
    for (var i = 0; i < 1000; i++) {
      var uuid = Blockly.utils.genUid();
      chai.assert.isFalse(uuid in uuids, 'UUID different: ' + uuid);
      uuids[uuid] = true;
    }
  });

  suite('tokenizeInterpolation', function() {
    test('Basic', function() {
      var tokens = Blockly.utils.tokenizeInterpolation('');
      assertArrayEquals('Null interpolation', [], tokens);

      tokens = Blockly.utils.tokenizeInterpolation('Hello');
      assertArrayEquals('No interpolation', ['Hello'], tokens);

      tokens = Blockly.utils.tokenizeInterpolation('Hello%World');
      assertArrayEquals('Unescaped %.', ['Hello%World'], tokens);

      tokens = Blockly.utils.tokenizeInterpolation('Hello%%World');
      assertArrayEquals('Escaped %.', ['Hello%World'], tokens);

      tokens = Blockly.utils.tokenizeInterpolation('Hello %1 World');
      assertArrayEquals('Interpolation.', ['Hello ', 1, ' World'], tokens);

      tokens = Blockly.utils.tokenizeInterpolation('%123Hello%456World%789');
      assertArrayEquals('Interpolations.', [123, 'Hello', 456, 'World', 789], tokens);

      tokens = Blockly.utils.tokenizeInterpolation('%%%x%%0%00%01%');
      assertArrayEquals('Torture interpolations.', ['%%x%0', 0, 1, '%'], tokens);
    });

    test('String table', function() {
      Blockly.Msg = Blockly.Msg || {};
      Blockly.Msg.STRING_REF = 'test string';
      var tokens = Blockly.utils.tokenizeInterpolation('%{bky_string_ref}');
      assertArrayEquals('String table reference, lowercase', ['test string'], tokens);
      tokens = Blockly.utils.tokenizeInterpolation('%{BKY_STRING_REF}');
      assertArrayEquals('String table reference, uppercase', ['test string'], tokens);

      Blockly.Msg.WITH_PARAM = 'before %1 after';
      tokens = Blockly.utils.tokenizeInterpolation('%{bky_with_param}');
      assertArrayEquals('String table reference, with parameter', ['before ', 1, ' after'], tokens);

      Blockly.Msg.RECURSE = 'before %{bky_string_ref} after';
      tokens = Blockly.utils.tokenizeInterpolation('%{bky_recurse}');
      assertArrayEquals('String table reference, with subreference', ['before test string after'], tokens);
    });

    test('Error cases', function() {
      var tokens = Blockly.utils.tokenizeInterpolation('%{bky_undefined}');
      assertArrayEquals('Undefined string table reference', ['%{bky_undefined}'], tokens);

      Blockly.Msg['1'] = 'Will not match';
      tokens = Blockly.utils.tokenizeInterpolation('before %{1} after');
      assertArrayEquals('Invalid initial digit in string table reference', ['before %{1} after'], tokens);

      Blockly.Msg['TWO WORDS'] = 'Will not match';
      tokens = Blockly.utils.tokenizeInterpolation('before %{two words} after');
      assertArrayEquals('Invalid character in string table reference: space', ['before %{two words} after'], tokens);

      Blockly.Msg['TWO-WORDS'] = 'Will not match';
      tokens = Blockly.utils.tokenizeInterpolation('before %{two-words} after');
      assertArrayEquals('Invalid character in string table reference: dash', ['before %{two-words} after'], tokens);

      Blockly.Msg['TWO.WORDS'] = 'Will not match';
      tokens = Blockly.utils.tokenizeInterpolation('before %{two.words} after');
      assertArrayEquals('Invalid character in string table reference: period', ['before %{two.words} after'], tokens);

      Blockly.Msg['AB&C'] = 'Will not match';
      tokens = Blockly.utils.tokenizeInterpolation('before %{ab&c} after');
      assertArrayEquals('Invalid character in string table reference: &', ['before %{ab&c} after'], tokens);

      Blockly.Msg['UNCLOSED'] = 'Will not match';
      tokens = Blockly.utils.tokenizeInterpolation('before %{unclosed');
      assertArrayEquals('String table reference, with parameter', ['before %{unclosed'], tokens);
    });
  });

  test('replaceMessageReferences', function() {
    Blockly.Msg = Blockly.Msg || {};
    Blockly.Msg.STRING_REF = 'test string';
    Blockly.Msg.SUBREF = 'subref';
    Blockly.Msg.STRING_REF_WITH_ARG = 'test %1 string';
    Blockly.Msg.STRING_REF_WITH_SUBREF = 'test %{bky_subref} string';

    var resultString = Blockly.utils.replaceMessageReferences('');
    assertEquals('Empty string produces empty string', '', resultString);

    resultString = Blockly.utils.replaceMessageReferences('%%');
    assertEquals('Escaped %', '%', resultString);
    resultString = Blockly.utils.replaceMessageReferences('%%{bky_string_ref}');
    assertEquals('Escaped %', '%{bky_string_ref}', resultString);

    resultString = Blockly.utils.replaceMessageReferences('%a');
    assertEquals('Unrecognized % escape code treated as literal', '%a', resultString);

    resultString = Blockly.utils.replaceMessageReferences('%1');
    assertEquals('Interpolation tokens ignored.', '%1', resultString);
    resultString = Blockly.utils.replaceMessageReferences('%1 %2');
    assertEquals('Interpolation tokens ignored.', '%1 %2', resultString);
    resultString = Blockly.utils.replaceMessageReferences('before %1 after');
    assertEquals('Interpolation tokens ignored.', 'before %1 after', resultString);

    // Blockly.Msg.STRING_REF cases:
    resultString = Blockly.utils.replaceMessageReferences('%{bky_string_ref}');
    assertEquals('Message ref dereferenced.', 'test string', resultString);
    resultString = Blockly.utils.replaceMessageReferences('before %{bky_string_ref} after');
    assertEquals('Message ref dereferenced.', 'before test string after', resultString);

    // Blockly.Msg.STRING_REF_WITH_ARG cases:
    resultString = Blockly.utils.replaceMessageReferences('%{bky_string_ref_with_arg}');
    assertEquals('Message ref dereferenced with argument preserved.', 'test %1 string', resultString);
    resultString = Blockly.utils.replaceMessageReferences('before %{bky_string_ref_with_arg} after');
    assertEquals('Message ref dereferenced with argument preserved.', 'before test %1 string after', resultString);

    // Blockly.Msg.STRING_REF_WITH_SUBREF cases:
    resultString = Blockly.utils.replaceMessageReferences('%{bky_string_ref_with_subref}');
    assertEquals('Message ref and subref dereferenced.', 'test subref string', resultString);
    resultString = Blockly.utils.replaceMessageReferences('before %{bky_string_ref_with_subref} after');
    assertEquals('Message ref and subref dereferenced.', 'before test subref string after', resultString);
  });

  test('arrayRemove', function() {
    var arr = [1, 2, 3, 2];
    assertEquals('Remove Not found', false, Blockly.utils.arrayRemove(arr, 0));
    assertEquals('Remove Not found result', '1,2,3,2', arr.join(','));
    assertEquals('Remove item', true, Blockly.utils.arrayRemove(arr, 2));
    assertEquals('Remove item result', '1,3,2', arr.join(','));
    assertEquals('Remove item again', true, Blockly.utils.arrayRemove(arr, 2));
    assertEquals('Remove item again result', '1,3', arr.join(','));
  });

  test('XY_REGEX_', function() {
    var regex = Blockly.utils.getRelativeXY.XY_REGEX_;
    var m;
    m = 'INVALID'.match(regex);
    assertNull(m);

    m = 'translate(10)'.match(regex);
    assertEquals('translate(10), x', '10', m[1]);
    assertUndefined('translate(10), y', m[3]);

    m = 'translate(11, 12)'.match(regex);
    assertEquals('translate(11, 12), x', '11', m[1]);
    assertEquals('translate(11, 12), y', '12', m[3]);

    m = 'translate(13,14)'.match(regex);
    assertEquals('translate(13,14), x', '13', m[1]);
    assertEquals('translate(13,14), y', '14', m[3]);

    m = 'translate(15 16)'.match(regex);
    assertEquals('translate(15 16), x', '15', m[1]);
    assertEquals('translate(15 16), y', '16', m[3]);

    m = 'translate(1.23456e+42 0.123456e-42)'.match(regex);
    assertEquals('translate(1.23456e+42 0.123456e-42), x', '1.23456e+42', m[1]);
    assertEquals('translate(1.23456e+42 0.123456e-42), y', '0.123456e-42', m[3]);
  });

  test('XY_STYLE_REGEX_', function() {
    var regex = Blockly.utils.getRelativeXY.XY_STYLE_REGEX_;
    var m;
    m = 'INVALID'.match(regex);
    assertNull(m);

    m = 'transform:translate(9px)'.match(regex);
    assertEquals('transform:translate(9px), x', '9', m[1]);
    assertUndefined('transform:translate(9px), y', m[3]);

    m = 'transform:translate3d(10px)'.match(regex);
    assertEquals('transform:translate3d(10px), x', '10', m[1]);
    assertUndefined('transform:translate(10px), y', m[3]);

    m = 'transform: translate(11px, 12px)'.match(regex);
    assertEquals('transform: translate(11px, 12px), x', '11', m[1]);
    assertEquals('transform: translate(11px, 12px), y', '12', m[3]);

    m = 'transform: translate(13px,14px)'.match(regex);
    assertEquals('transform: translate(13px,14px), x', '13', m[1]);
    assertEquals('transform: translate(13px,14px), y', '14', m[3]);

    m = 'transform: translate(15px 16px)'.match(regex);
    assertEquals('transform: translate(15px 16px), x', '15', m[1]);
    assertEquals('transform: translate(15px 16px), y', '16', m[3]);

    m = 'transform: translate(1.23456e+42px 0.123456e-42px)'.match(regex);
    assertEquals('transform: translate(1.23456e+42px 0.123456e-42px), x', '1.23456e+42', m[1]);
    assertEquals('transform: translate(1.23456e+42px 0.123456e-42px), y', '0.123456e-42', m[3]);

    m = 'transform:translate3d(20px, 21px, 22px)'.match(regex);
    assertEquals('transform:translate3d(20px, 21px, 22px), x', '20', m[1]);
    assertEquals('transform:translate3d(20px, 21px, 22px), y', '21', m[3]);

    m = 'transform:translate3d(23px,24px,25px)'.match(regex);
    assertEquals('transform:translate3d(23px,24px,25px), x', '23', m[1]);
    assertEquals('transform:translate3d(23px,24px,25px), y', '24', m[3]);

    m = 'transform:translate3d(26px 27px 28px)'.match(regex);
    assertEquals('transform:translate3d(26px 27px 28px), x', '26', m[1]);
    assertEquals('transform:translate3d(26px 27px 28px), y', '27', m[3]);

    m = 'transform:translate3d(1.23456e+42px 0.123456e-42px 42px)'.match(regex);
    assertEquals('transform:translate3d(1.23456e+42px 0.123456e-42px 42px), x', '1.23456e+42', m[1]);
    assertEquals('transform:translate3d(1.23456e+42px 0.123456e-42px 42px), y', '0.123456e-42', m[3]);
  });

  suite('DOM', function() {
    test('addClass', function() {
      var p = document.createElement('p');
      Blockly.utils.dom.addClass(p, 'one');
      assertEquals('Adding "one"', 'one', p.className);
      Blockly.utils.dom.addClass(p, 'one');
      assertEquals('Adding duplicate "one"', 'one', p.className);
      Blockly.utils.dom.addClass(p, 'two');
      assertEquals('Adding "two"', 'one two', p.className);
      Blockly.utils.dom.addClass(p, 'two');
      assertEquals('Adding duplicate "two"', 'one two', p.className);
      Blockly.utils.dom.addClass(p, 'three');
      assertEquals('Adding "three"', 'one two three', p.className);
    });

    test('hasClass', function() {
      var p = document.createElement('p');
      p.className = ' one three  two three  ';
      assertTrue('Has "one"', Blockly.utils.dom.hasClass(p, 'one'));
      assertTrue('Has "two"', Blockly.utils.dom.hasClass(p, 'two'));
      assertTrue('Has "three"', Blockly.utils.dom.hasClass(p, 'three'));
      assertFalse('Has no "four"', Blockly.utils.dom.hasClass(p, 'four'));
      assertFalse('Has no "t"', Blockly.utils.dom.hasClass(p, 't'));
    });

    test('removeClass', function() {
      var p = document.createElement('p');
      p.className = ' one three  two three  ';
      Blockly.utils.dom.removeClass(p, 'two');
      assertEquals('Removing "two"', 'one three three', p.className);
      Blockly.utils.dom.removeClass(p, 'four');
      assertEquals('Removing "four"', 'one three three', p.className);
      Blockly.utils.dom.removeClass(p, 'three');
      assertEquals('Removing "three"', 'one', p.className);
      Blockly.utils.dom.removeClass(p, 'ne');
      assertEquals('Removing "ne"', 'one', p.className);
      Blockly.utils.dom.removeClass(p, 'one');
      assertEquals('Removing "one"', '', p.className);
      Blockly.utils.dom.removeClass(p, 'zero');
      assertEquals('Removing "zero"', '', p.className);
    });
  });

  suite('String', function() {
    test('starts with', function() {
      assertEquals('Does not start with', false, Blockly.utils.string.startsWith('123', '2'));
      assertEquals('Start with', true, Blockly.utils.string.startsWith('123', '12'));
      assertEquals('Start with empty string 1', true, Blockly.utils.string.startsWith('123', ''));
      assertEquals('Start with empty string 2', true, Blockly.utils.string.startsWith('', ''));
    });

    test('shortest string length', function() {
      var len = Blockly.utils.string.shortestStringLength('one,two,three,four,five'.split(','));
      assertEquals('Length of "one"', 3, len);
      len = Blockly.utils.string.shortestStringLength('one,two,three,four,five,'.split(','));
      assertEquals('Length of ""', 0, len);
      len = Blockly.utils.string.shortestStringLength(['Hello World']);
      assertEquals('List of one', 11, len);
      len = Blockly.utils.string.shortestStringLength([]);
      assertEquals('Empty list', 0, len);
    });

    test('comment word prefix', function() {
      var len = Blockly.utils.string.commonWordPrefix('one,two,three,four,five'.split(','));
      assertEquals('No prefix', 0, len);
      len = Blockly.utils.string.commonWordPrefix('Xone,Xtwo,Xthree,Xfour,Xfive'.split(','));
      assertEquals('No word prefix', 0, len);
      len = Blockly.utils.string.commonWordPrefix('abc de,abc de,abc de,abc de'.split(','));
      assertEquals('Full equality', 6, len);
      len = Blockly.utils.string.commonWordPrefix('abc deX,abc deY'.split(','));
      assertEquals('One word prefix', 4, len);
      len = Blockly.utils.string.commonWordPrefix('abc de,abc deY'.split(','));
      assertEquals('Overflow no', 4, len);
      len = Blockly.utils.string.commonWordPrefix('abc de,abc de Y'.split(','));
      assertEquals('Overflow yes', 6, len);
      len = Blockly.utils.string.commonWordPrefix(['Hello World']);
      assertEquals('List of one', 11, len);
      len = Blockly.utils.string.commonWordPrefix([]);
      assertEquals('Empty list', 0, len);
      len = Blockly.utils.string.commonWordPrefix('turn&nbsp;left,turn&nbsp;right'.split(','));
      assertEquals('No prefix due to &amp;nbsp;', 0, len);
      len = Blockly.utils.string.commonWordPrefix('turn\u00A0left,turn\u00A0right'.split(','));
      assertEquals('No prefix due to \\u00A0', 0, len);
    });

    test('comment word suffix', function() {
      var len = Blockly.utils.string.commonWordSuffix('one,two,three,four,five'.split(','));
      assertEquals('No suffix', 0, len);
      len = Blockly.utils.string.commonWordSuffix('oneX,twoX,threeX,fourX,fiveX'.split(','));
      assertEquals('No word suffix', 0, len);
      len = Blockly.utils.string.commonWordSuffix('abc de,abc de,abc de,abc de'.split(','));
      assertEquals('Full equality', 6, len);
      len = Blockly.utils.string.commonWordSuffix('Xabc de,Yabc de'.split(','));
      assertEquals('One word suffix', 3, len);
      len = Blockly.utils.string.commonWordSuffix('abc de,Yabc de'.split(','));
      assertEquals('Overflow no', 3, len);
      len = Blockly.utils.string.commonWordSuffix('abc de,Y abc de'.split(','));
      assertEquals('Overflow yes', 6, len);
      len = Blockly.utils.string.commonWordSuffix(['Hello World']);
      assertEquals('List of one', 11, len);
      len = Blockly.utils.string.commonWordSuffix([]);
      assertEquals('Empty list', 0, len);
    });
  });

  suite('Math', function() {
    test('toRadians', function() {
      var quarter = Math.PI / 2;
      assertEquals('-90', -quarter, Blockly.utils.math.toRadians(-90));
      assertEquals('0', 0, Blockly.utils.math.toRadians(0));
      assertEquals('90', quarter, Blockly.utils.math.toRadians(90));
      assertEquals('180', 2 * quarter, Blockly.utils.math.toRadians(180));
      assertEquals('270', 3 * quarter, Blockly.utils.math.toRadians(270));
      assertEquals('360', 4 * quarter, Blockly.utils.math.toRadians(360));
      assertEquals('450', 5 * quarter, Blockly.utils.math.toRadians(360 + 90));
    });

    test('toDegrees', function() {
      var quarter = Math.PI / 2;
      assertEquals('-90', -90, Blockly.utils.math.toDegrees(-quarter));
      assertEquals('0', 0, Blockly.utils.math.toDegrees(0));
      assertEquals('90', 90, Blockly.utils.math.toDegrees(quarter));
      assertEquals('180', 180, Blockly.utils.math.toDegrees(2 * quarter));
      assertEquals('270', 270, Blockly.utils.math.toDegrees(3 * quarter));
      assertEquals('360', 360, Blockly.utils.math.toDegrees(4 * quarter));
      assertEquals('450', 360 + 90, Blockly.utils.math.toDegrees(5 * quarter));
    });
  });
});
