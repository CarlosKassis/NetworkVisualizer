import React, { Component } from 'react';
import { Container } from 'reactstrap';
import { NavMenu } from './NavMenu';

export class Layout extends Component {
  static displayName = Layout.name;

  render() {
    return (
      <div>
        <NavMenu />
            <Container tag="main" style={{  maxWidth:'90%' } }>
          {this.props.children}
        </Container>
      </div>
    );
  }
}
