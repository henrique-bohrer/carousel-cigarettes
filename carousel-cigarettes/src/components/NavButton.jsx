import styles from './NavButton.module.css'; // Importa o CSS Module

const NavButton = (props) => {
  const { show, onClick, icon } = props;

  return !show ? null : (
    <button onClick={onClick} className={styles.navButton}>
      <i className={`fa-solid ${icon}`}></i>
    </button>
  );
};

export default NavButton;