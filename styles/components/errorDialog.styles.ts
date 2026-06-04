import { StyleSheet } from 'react-native'
import { COLORS } from '../../constants/color'

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: '80%',
    padding: 25,
    backgroundColor: COLORS.white,
    borderRadius: 18,
    alignItems: 'center',
    elevation: 10,
    shadowColor: COLORS.black,
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 10,
    color: '#333',
  },
  message: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 15,
    color: '#444',
    maxWidth: '90%',
  },
  button: {
    marginTop: 20,
    backgroundColor: COLORS.primaryLight,
    paddingVertical: 10,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  btnText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
})

export default styles
