import UsersMapScreen from '../screens/UsersMapScreen';

export interface UserConnection {
  id: string;
  name: string;
  relation: string;
  avatar?: string;
  description?: string;
  isFavorite?: boolean;
}

export default UsersMapScreen;
export { UsersMapScreen };
