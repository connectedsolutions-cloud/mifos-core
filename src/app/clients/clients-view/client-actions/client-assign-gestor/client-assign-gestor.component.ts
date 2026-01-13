/** Angular Imports */
import { Component, OnInit } from '@angular/core';
import { UntypedFormGroup, UntypedFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

/** Custom Services */
import { ClientsService } from 'app/clients/clients.service';
import { STANDALONE_SHARED_IMPORTS } from 'app/standalone-shared.module';

/**
 * Clients Assign Gestor Component
 */
@Component({
  selector: 'mifosx-client-assign-gestor',
  templateUrl: './client-assign-gestor.component.html',
  styleUrls: ['./client-assign-gestor.component.scss'],
  imports: [
    ...STANDALONE_SHARED_IMPORTS
  ]
})
export class ClientAssignGestorComponent implements OnInit {
  /** Client Assign Gestor form. */
  clientAssignGestorForm: UntypedFormGroup;
  /** Gestor Data */
  gestorData: any;
  /** Client Data */
  clientData: any;

  /**
   * Fetches Client Action Data from `resolve`
   * @param {FormBuilder} formBuilder Form Builder
   * @param {ClientsService} clientsService Clients Service
   * @param {ActivatedRoute} route Activated Route
   * @param {Router} router Router
   */
  constructor(
    private formBuilder: UntypedFormBuilder,
    private clientsService: ClientsService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.route.data.subscribe((data: { clientActionData: any }) => {
      this.clientData = data.clientActionData;
    });
  }

  /**
   * Creates the client assign gestor form.
   */
  ngOnInit() {
    this.gestorData = this.clientData.staffOptions;
    this.createClientAssignGestorForm();
  }

  /**
   * Creates the client assign gestor form.
   */
  createClientAssignGestorForm() {
    this.clientAssignGestorForm = this.formBuilder.group({
      gestorId: ['']
    });
  }

  /**
   * Submits the form and assigns gestor for the client.
   */
  submit() {
    this.clientsService
      .executeClientCommand(this.clientData.id, 'assignGestor', this.clientAssignGestorForm.value)
      .subscribe(() => {
        this.router.navigate(['../../'], { relativeTo: this.route });
      });
  }
}
