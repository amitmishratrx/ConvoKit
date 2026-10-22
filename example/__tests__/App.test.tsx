import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Text, TextInput } from 'react-native';
import App from '../App';
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
jest.mock(
  'react-native-safe-area-context',
  () => require('react-native-safe-area-context/jest/mock').default,
);
const button = (root: ReactTestRenderer.ReactTestInstance, label: string) =>
  root.findAll(
    n =>
      n.props.accessibilityLabel === label &&
      typeof n.props.onPress === 'function',
  )[0];
test('direct chat sends a message and back restores the list', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  await act(async () => button(app.root, 'Open Maya Chen').props.onPress());
  await act(async () =>
    app.root
      .findAllByType(TextInput)
      .find(n => n.props.accessibilityLabel === 'Message')!
      .props.onChangeText('Hello Maya'),
  );
  await act(async () => button(app.root, 'Send').props.onPress());
  expect(
    app.root.findAllByType(Text).some(n => n.props.children === 'Hello Maya'),
  ).toBe(true);
  await act(async () =>
    button(app.root, 'Back to conversations').props.onPress(),
  );
  expect(button(app.root, 'Open Maya Chen')).toBeDefined();
  await act(async () => app.unmount());
});
test('group creation opens a group thread and preserves the Groups tab on back', async () => {
  let app!: ReactTestRenderer.ReactTestRenderer;
  await act(async () => {
    app = ReactTestRenderer.create(<App />);
  });
  const groups = app.root.findAll(
    n =>
      n.props.accessibilityRole === 'tab' &&
      n.findAllByType(Text).some(t => t.props.children === 'Groups'),
  )[0];
  await act(async () => groups.props.onPress());
  await act(async () => button(app.root, '＋  Create group').props.onPress());
  await act(async () =>
    app.root
      .findAllByType(TextInput)
      .find(n => n.props.accessibilityLabel === 'Group name')!
      .props.onChangeText('Design circle'),
  );
  await act(async () => button(app.root, 'Maya Chen').props.onPress());
  await act(async () => button(app.root, 'Sofia Patel').props.onPress());
  await act(async () => button(app.root, 'Create group').props.onPress());
  expect(
    app.root.findAllByType(Text).some(n => n.props.children === '3 members'),
  ).toBe(true);
  await act(async () =>
    button(app.root, 'Back to conversations').props.onPress(),
  );
  expect(button(app.root, 'Open Design circle')).toBeDefined();
  await act(async () => app.unmount());
});
